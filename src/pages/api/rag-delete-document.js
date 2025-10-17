import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

const CHROMA_PATH_DEFAULT = process.env.CHROMA_PATH || '/home/siwasoft/siwasoft/emd';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { collection, id, chroma } = req.query;
    if (!collection || !id) {
      return res.status(400).json({ success: false, error: 'collection and id are required' });
    }

    const pythonScript = `
import sys, json
import chromadb

path = sys.argv[1]
coll = sys.argv[2]
doc_id = sys.argv[3]

try:
    client = chromadb.PersistentClient(path=path)
    c = client.get_collection(coll)
    c.delete(ids=[doc_id])
    print(json.dumps({"ok": True, "deleted": doc_id}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`.trim();

    const { stdout, stderr } = await execFileAsync(
      'python3',
      ['-c', pythonScript, chroma || CHROMA_PATH_DEFAULT, String(collection), String(id)],
      { maxBuffer: 1024 * 1024 * 10 }
    );
    if (stderr) console.log('Python delete stderr:', stderr);

    const result = JSON.parse(String(stdout).trim().split('\n').pop());
    if (result.ok) {
      // 개별 문서 삭제 시에도 상태 파일 업데이트 (프로젝트가 완전히 삭제된 경우)
      try {
        const chromaPath = chroma || CHROMA_PATH_DEFAULT;
        const safeCollectionName = collection.replace(/[^a-zA-Z0-9_-]/g, '_');
        const stateFileName = `github_repos_state_${safeCollectionName}.json`;
        const stateFilePath = path.join(chromaPath, stateFileName);
        
        // 문서 ID에서 프로젝트명 추출: "project:FILE:..." -> "project"
        const docId = id;
        if (docId && docId.includes(':')) {
          const projectName = docId.split(':')[0];
          
          if (fs.existsSync(stateFilePath)) {
            // 상태 파일 읽기
            const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
            
            // 해당 프로젝트의 모든 문서가 삭제되었는지 확인
            const pythonCheckScript = `
import sys, json
import chromadb

path = sys.argv[1]
coll = sys.argv[2]
project = sys.argv[3]

try:
    client = chromadb.PersistentClient(path=path)
    c = client.get_collection(coll)
    results = c.get()
    
    # 해당 프로젝트의 문서가 남아있는지 확인
    remaining_docs = [doc_id for doc_id in results.get("ids", []) if doc_id.startswith(project + ":")]
    
    print(json.dumps({"ok": True, "hasRemainingDocs": len(remaining_docs) > 0}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`.trim();
            
            const { stdout: checkStdout } = await execFileAsync(
              'python3',
              ['-c', pythonCheckScript, chromaPath, String(collection), String(projectName)],
              { maxBuffer: 1024 * 1024 * 10 }
            );
            
            const checkResult = JSON.parse(String(checkStdout).trim().split('\n').pop());
            
            // 해당 프로젝트의 문서가 더 이상 없으면 상태 파일에서 제거 (부분 매칭 지원)
            if (checkResult.ok && !checkResult.hasRemainingDocs) {
              let stateFileUpdated = false;
              if (Array.isArray(stateData)) {
                const originalLength = stateData.length;
                const updatedData = stateData.filter(repo => {
                  // 정확한 매칭 또는 부분 매칭 (repo가 projectName으로 끝나는 경우)
                  return repo !== projectName && !repo.endsWith(`/${projectName}`);
                });
                if (updatedData.length !== originalLength) {
                  fs.writeFileSync(stateFilePath, JSON.stringify(updatedData, null, 2));
                  stateFileUpdated = true;
                  console.log(`Removed project "${projectName}" from state file (no remaining docs): ${stateFilePath}`);
                }
              } else if (stateData && Array.isArray(stateData.repos)) {
                const originalLength = stateData.repos.length;
                stateData.repos = stateData.repos.filter(repo => {
                  // 정확한 매칭 또는 부분 매칭 (repo가 projectName으로 끝나는 경우)
                  return repo !== projectName && !repo.endsWith(`/${projectName}`);
                });
                if (stateData.repos.length !== originalLength) {
                  fs.writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));
                  stateFileUpdated = true;
                  console.log(`Removed project "${projectName}" from state file (no remaining docs): ${stateFilePath}`);
                }
              }
              
              // 백업 파일 생성 (안전장치)
              if (stateFileUpdated) {
                const backupPath = `${stateFilePath}.backup.${Date.now()}`;
                fs.writeFileSync(backupPath, JSON.stringify(stateData, null, 2));
                console.log(`Created backup: ${backupPath}`);
              }
            }
          }
        }
        
      } catch (fileError) {
        console.error('Error updating state file:', fileError);
        // 파일 업데이트 실패는 전체 작업을 실패시키지 않음
      }
      
      return res.status(200).json({ success: true, deleted: result.deleted });
    }
    return res.status(500).json({ success: false, error: result.error || 'Delete failed' });
  } catch (err) {
    console.error('rag-delete-document API error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + (err?.message || String(err)) });
  }
}


