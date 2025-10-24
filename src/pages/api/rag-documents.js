// pages/api/rag-documents.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const EMB_API_BASE = process.env.EMB_API_BASE || 'http://221.139.227.131:8001';
const TARGET_DIR = process.env.RAG_TARGET_DIR || '/home/siwasoft/siwasoft/mcp/end';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/home/siwasoft/siwasoft/mcp/out';
const CHROMA_PATH_DEFAULT = process.env.CHROMA_PATH || '/home/siwasoft/siwasoft/emd';
const ARCHIVE_DIR = process.env.ARCHIVE_DIR || '/home/siwasoft/siwasoft/mcp/end';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { collection, chroma } = req.query;
    if (!collection) {
      return res.status(400).json({ success: false, error: 'Collection parameter is required' });
    }

    console.log(`Fetching documents for collection: ${collection}`);

    // ── 방법 1: ChromaDB 직접 조회 ───────────────────────────────────────────
    try {
      const pythonScript = `
import sys, json, os
try:
    import chromadb
except Exception as e:
    print(json.dumps({"ok": False, "error": "chromadb import failed: " + str(e)}))
    raise

def main():
    path = sys.argv[1]
    coll = sys.argv[2]
    try:
        client = chromadb.PersistentClient(path=path)
        collection_obj = client.get_collection(coll)
        results = collection_obj.get(include=["metadatas", "documents"])

        documents = []
        if results and results.get("ids"):
            ids   = results.get("ids") or []
            metas = results.get("metadatas") or []
            docs  = results.get("documents") or []
            for i, doc_id in enumerate(ids):
                md  = metas[i] if i < len(metas) else {}
                doc = docs[i] if i < len(docs) else ""
                # 파일명 우선순위: source → filename → file_path → ID 파싱 → 폴백(document_i)
                filename = md.get("source", md.get("filename", md.get("file_path", f"document_{i+1}")))
                
                # Git.py ID 패턴 파싱: "repo:FILE:path:001" -> "path"
                if filename.startswith("document_") and ":" in doc_id:
                    parts = doc_id.split(":")
                    if len(parts) >= 3 and parts[1] == "FILE":
                        # "repo:FILE:path_file:001" -> "path/file"
                        file_part = parts[2]
                        filename = file_part.replace("_", "/")
                    elif len(parts) >= 3 and parts[1] == "FOLDER":
                        # "repo:FOLDER:path_folder" -> "path/folder/"
                        folder_part = parts[2]
                        filename = folder_part.replace("_", "/") + "/"
                    elif len(parts) >= 2 and parts[1] == "PROJECT":
                        # "repo:PROJECT:000" -> "프로젝트 개요"
                        filename = "프로젝트 개요"
                
                # 전체 경로 유지 (트리뷰를 위해)
                documents.append({
                    "id": doc_id,
                    "filename": filename,
                    "created_at": md.get("created_at", ""),
                    "size": len(doc) if isinstance(doc, str) else 0,
                    "type": "embedded"
                })
        print(json.dumps({"ok": True, "documents": documents}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))

if __name__ == "__main__":
    main()
`.trim();

      const { stdout, stderr } = await execFileAsync(
        'python3',
        ['-c', pythonScript, chroma || CHROMA_PATH_DEFAULT, String(collection)],
        { maxBuffer: 1024 * 1024 * 10 }
      );
      if (stderr) console.log('Python script stderr:', stderr);

      // 마지막 줄 JSON 파싱
      const lines = String(stdout).trim().split('\n');
      const result = JSON.parse(lines[lines.length - 1]);

      if (result.ok && Array.isArray(result.documents) && result.documents.length > 0) {
        console.log(`Found ${result.documents.length} embedded documents in ChromaDB`);

        // ▶ 프론트 호환 매핑: created_at→createdAt, filename→name/date도 함께 제공
        const docs = result.documents.map(d => {
          const createdAt = d.created_at || d.createdAt || '';
          const filename  = d.filename || 'Unknown';
          return {
            id: d.id,
            filename,
            createdAt,
            size: d.size || 0,
            type: d.type || 'embedded',
            // 프론트가 name/date 키만 봐도 동작하도록 추가
            name: filename,
            date: createdAt
          };
        });

        // 샘플 로그
        if (docs.length) console.log('[rag-documents] sample doc', docs[0]);

        return res.status(200).json({ success: true, documents: docs });
      }
    } catch (chromaError) {
      console.log('ChromaDB query failed:', chromaError.message);
    }

    // ── 방법 2: FastAPI 폴백 ────────────────────────────────────────────────
    try {
      const response = await fetch(`${EMB_API_BASE}/collections/${collection}/documents`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && Array.isArray(data.documents)) {
          const docs = data.documents.map(doc => {
            const createdAt = doc.created_at || doc.createdAt || new Date().toISOString();
            const filename  = doc.filename || doc.name || 'Unknown';
            return {
              id: doc.id || doc._id,
              filename,
              createdAt,
              size: doc.size || 0,
              type: 'embedded',
              name: filename,
              date: createdAt
            };
          });
          return res.status(200).json({ success: true, documents: docs });
        }
      } else {
        console.log(`FastAPI documents endpoint returned ${response.status}`);
      }
    } catch (apiError) {
      console.log('FastAPI documents endpoint not available:', apiError.message);
    }

    // ── 방법 3: 파일 시스템 폴백 ────────────────────────────────────────────
    const documents = [];

    // 3-1. 원본 PDF (TARGET_DIR)
    try {
      if (fs.existsSync(TARGET_DIR)) {
        const pdfFiles = fs.readdirSync(TARGET_DIR)
          .filter(file => file.toLowerCase().endsWith('.pdf'))
          .map(file => {
            const filePath = path.join(TARGET_DIR, file);
            const stats = fs.statSync(filePath);
            const createdAt = stats.birthtime?.toISOString?.() || new Date(stats.mtimeMs).toISOString();
            return {
              id: `pdf_${file}`,
              filename: file,
              createdAt,
              size: stats.size,
              type: 'original',
              name: file,
              date: createdAt
            };
          });
        documents.push(...pdfFiles);
      }
    } catch (e) {
      console.log('TARGET_DIR scan error:', e.message);
    }

    // 3-2. 처리된 문서들 (OUTPUT_DIR)
    try {
      if (fs.existsSync(OUTPUT_DIR)) {
        const outputFiles = fs.readdirSync(OUTPUT_DIR)
          .filter(file => {
            const f = file.toLowerCase();
            return f.endsWith('.txt') || f.endsWith('.json');
          })
          .map(file => {
            const filePath = path.join(OUTPUT_DIR, file);
            const stats = fs.statSync(filePath);
            const createdAt = stats.birthtime?.toISOString?.() || new Date(stats.mtimeMs).toISOString();
            return {
              id: `output_${file}`,
              filename: file,
              createdAt,
              size: stats.size,
              type: 'processed',
              name: file,
              date: createdAt
            };
          });
        documents.push(...outputFiles);
      }
    } catch (e) {
      console.log('OUTPUT_DIR scan error:', e.message);
    }

    // 3-3. 아카이브 (ARCHIVE_DIR)
    try {
      if (fs.existsSync(ARCHIVE_DIR)) {
        const archiveFiles = fs.readdirSync(ARCHIVE_DIR)
          .filter(file => {
            const f = file.toLowerCase();
            return f.endsWith('.pdf') || f.endsWith('.txt');
          })
          .map(file => {
            const filePath = path.join(ARCHIVE_DIR, file);
            const stats = fs.statSync(filePath);
            const createdAt = stats.birthtime?.toISOString?.() || new Date(stats.mtimeMs).toISOString();
            return {
              id: `archive_${file}`,
              filename: file,
              createdAt,
              size: stats.size,
              type: 'archived',
              name: file,
              date: createdAt
            };
          });
        documents.push(...archiveFiles);
      }
    } catch (e) {
      console.log('ARCHIVE_DIR scan error:', e.message);
    }

    // 정렬
    documents.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    console.log(`Found ${documents.length} documents for collection ${collection} (file system)`);

    return res.status(200).json({ success: true, documents });

  } catch (err) {
    console.error('rag-documents API error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + (err?.message || String(err))
    });
  }
}
