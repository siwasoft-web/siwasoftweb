import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const EMB_API_BASE = process.env.EMB_API_BASE || 'http://221.139.227.131:8001';
const CARBON_DIR = process.env.CARBON_DIR || '/home/siwasoft/siwasoft/carbon';
const CHROMA_PATH = process.env.CHROMA_PATH || '/home/siwasoft/siwasoft/emd';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { collection } = req.query;
    
    if (!collection) {
      return res.status(400).json({ success: false, error: 'Collection parameter is required' });
    }

    console.log(`Fetching carbon documents for collection: ${collection}`);

    // 방법 1: ChromaDB에서 탄소배출량 관련 문서 조회
    try {
      const pythonScript = `
import chromadb
import json
import os

try:
    client = chromadb.PersistentClient(path="${CHROMA_PATH}")
    collection_obj = client.get_collection("${collection}")
    
    # 컬렉션의 모든 문서 조회
    results = collection_obj.get(include=["metadatas", "documents"])
    
    documents = []
    if results and results['ids']:
        for i, doc_id in enumerate(results['ids']):
            metadata = results['metadatas'][i] if results['metadatas'] else {}
            document = results['documents'][i] if results['documents'] else ""
            
            # 탄소배출량 관련 문서만 필터링
            filename = metadata.get('source', metadata.get('filename', f'document_{i+1}'))
            if isinstance(filename, str) and '/' in filename:
                filename = os.path.basename(filename)
            
            # 탄소배출량 관련 키워드 확인
            is_carbon_related = False
            if filename:
                filename_lower = filename.lower()
                is_carbon_related = any(keyword in filename_lower for keyword in 
                    ['carbon', '탄소', 'emission', 'co2', 'greenhouse', 'climate'])
            
            if document:
                doc_lower = document.lower()
                is_carbon_related = is_carbon_related or any(keyword in doc_lower for keyword in 
                    ['carbon', '탄소', 'emission', 'co2', 'greenhouse', 'climate', '배출'])
            
            if is_carbon_related:
                documents.append({
                    'id': doc_id,
                    'filename': filename,
                    'created_at': metadata.get('created_at', ''),
                    'size': len(document) if document else 0,
                    'type': 'carbon_embedded'
                })
    
    print(json.dumps({'ok': True, 'documents': documents}))
    
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e)}))
`;

      const { stdout, stderr } = await execAsync(`python3 -c "${pythonScript}"`);
      
      if (stderr) {
        console.log('Python script stderr:', stderr);
      }
      
      const result = JSON.parse(stdout);
      
      if (result.ok && result.documents && result.documents.length > 0) {
        console.log(`Found ${result.documents.length} carbon-related embedded documents in ChromaDB`);
        return res.status(200).json({ 
          success: true, 
          documents: result.documents
        });
      }
    } catch (chromaError) {
      console.log('ChromaDB carbon query failed:', chromaError.message);
    }

    // 방법 2: FastAPI 서버에서 탄소배출량 문서 목록 조회 시도
    try {
      const response = await fetch(`${EMB_API_BASE}/carbon/${collection}/documents`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.documents) {
          return res.status(200).json({ 
            success: true, 
            documents: data.documents.map(doc => ({
              filename: doc.filename || doc.name || 'Unknown',
              createdAt: doc.created_at || doc.createdAt || new Date().toISOString(),
              size: doc.size || 0,
              id: doc.id || doc._id
            }))
          });
        }
      }
    } catch (apiError) {
      console.log('FastAPI carbon documents endpoint not available, falling back to file system');
    }

    // 방법 2: 파일 시스템에서 탄소배출량 문서 조회
    const documents = [];
    
    // 1. 탄소배출량 전용 디렉토리 조회
    if (fs.existsSync(CARBON_DIR)) {
      const carbonFiles = fs.readdirSync(CARBON_DIR)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.pdf', '.txt', '.xlsx', '.csv'].includes(ext);
        })
        .map(file => {
          const filePath = path.join(CARBON_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            createdAt: stats.birthtime.toISOString(),
            size: stats.size,
            id: `carbon_${file}`,
            type: 'carbon'
          };
        });
      documents.push(...carbonFiles);
    }

    // 2. 일반 RAG 디렉토리에서 탄소배출량 관련 파일들 조회
    const ragDir = process.env.RAG_TARGET_DIR || '/home/siwasoft/siwasoft/mcp/pdf';
    if (fs.existsSync(ragDir)) {
      const ragFiles = fs.readdirSync(ragDir)
        .filter(file => {
          const fileName = file.toLowerCase();
          return fileName.includes('carbon') || 
                 fileName.includes('탄소') || 
                 fileName.includes('emission') ||
                 fileName.includes('co2') ||
                 fileName.includes('greenhouse');
        })
        .map(file => {
          const filePath = path.join(ragDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            createdAt: stats.birthtime.toISOString(),
            size: stats.size,
            id: `rag_carbon_${file}`,
            type: 'rag_carbon'
          };
        });
      documents.push(...ragFiles);
    }

    // 3. 출력 디렉토리에서 탄소배출량 관련 처리된 파일들 조회
    const outputDir = process.env.OUTPUT_DIR || '/home/siwasoft/siwasoft/mcp/out';
    if (fs.existsSync(outputDir)) {
      const outputFiles = fs.readdirSync(outputDir)
        .filter(file => {
          const fileName = file.toLowerCase();
          return (fileName.includes('carbon') || 
                  fileName.includes('탄소') || 
                  fileName.includes('emission') ||
                  fileName.includes('co2')) &&
                 (fileName.endsWith('.txt') || fileName.endsWith('.json'));
        })
        .map(file => {
          const filePath = path.join(outputDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            createdAt: stats.birthtime.toISOString(),
            size: stats.size,
            id: `output_carbon_${file}`,
            type: 'processed_carbon'
          };
        });
      documents.push(...outputFiles);
    }

    // 생성일 기준으로 정렬 (최신순)
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`Found ${documents.length} carbon documents for collection ${collection}`);

    return res.status(200).json({ 
      success: true, 
      documents: documents
    });

  } catch (err) {
    console.error('carbon-documents API error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}
