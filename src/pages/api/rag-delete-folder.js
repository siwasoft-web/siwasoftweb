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
    const { collection, project, folder, chroma } = req.query;
    if (!collection || !project || !folder) {
      return res.status(400).json({ success: false, error: 'collection, project, and folder are required' });
    }

    const pythonScript = `
import sys, json
import chromadb

path = sys.argv[1]
coll = sys.argv[2]
project = sys.argv[3]
folder = sys.argv[4]

try:
    client = chromadb.PersistentClient(path=path)
    c = client.get_collection(coll)
    
    # 모든 문서를 가져와서 폴더에 해당하는 문서들 찾기
    results = c.get(include=["metadatas"])
    ids_to_delete = []
    
    if results and results.get("ids"):
        ids = results.get("ids") or []
        metas = results.get("metadatas") or []
        
        for i, doc_id in enumerate(ids):
            md = metas[i] if i < len(metas) else {}
            
            # ID 패턴 확인: "project:FILE:folder_path:001" 또는 "project:FOLDER:folder_path"
            if ":" in doc_id:
                parts = doc_id.split(":")
                if len(parts) >= 3 and parts[0] == project:
                    if parts[1] == "FILE" and len(parts) >= 3:
                        # 파일 경로에서 폴더 확인
                        file_path = parts[2].replace("_", "/")
                        if file_path.startswith(folder + "/") or file_path == folder:
                            ids_to_delete.append(doc_id)
                    elif parts[1] == "FOLDER" and len(parts) >= 3:
                        # 폴더 경로 확인
                        folder_path = parts[2].replace("_", "/")
                        if folder_path == folder or folder_path.startswith(folder + "/"):
                            ids_to_delete.append(doc_id)
    
    # 삭제 실행
    if ids_to_delete:
        c.delete(ids=ids_to_delete)
        print(json.dumps({"ok": True, "deleted": ids_to_delete, "deletedCount": len(ids_to_delete)}))
    else:
        print(json.dumps({"ok": True, "deleted": [], "deletedCount": 0}))
        
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`.trim();

    const { stdout, stderr } = await execFileAsync(
      'python3',
      ['-c', pythonScript, chroma || CHROMA_PATH_DEFAULT, String(collection), String(project), String(folder)],
      { maxBuffer: 1024 * 1024 * 10 }
    );
    if (stderr) console.log('Python delete folder stderr:', stderr);

    const result = JSON.parse(String(stdout).trim().split('\n').pop());
    if (result.ok) {
      // 폴더 삭제 성공 시 상태 파일에서 해당 프로젝트 제거
      try {
        const chromaPath = chroma || CHROMA_PATH_DEFAULT;
        const safeCollectionName = collection.replace(/[^a-zA-Z0-9_-]/g, '_');
        const stateFileName = `github_repos_state_${safeCollectionName}.json`;
        const stateFilePath = path.join(chromaPath, stateFileName);
        
        if (fs.existsSync(stateFilePath)) {
          // 상태 파일 읽기
          const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
          
          // 처리된 레포지토리 목록에서 해당 프로젝트 제거
          if (Array.isArray(stateData)) {
            const updatedData = stateData.filter(repo => repo !== project);
            fs.writeFileSync(stateFilePath, JSON.stringify(updatedData, null, 2));
            console.log(`Removed project "${project}" from state file: ${stateFilePath}`);
          } else if (stateData && Array.isArray(stateData.repos)) {
            stateData.repos = stateData.repos.filter(repo => repo !== project);
            fs.writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));
            console.log(`Removed project "${project}" from state file: ${stateFilePath}`);
          }
        }
        
      } catch (fileError) {
        console.error('Error updating state file:', fileError);
        // 파일 업데이트 실패는 전체 작업을 실패시키지 않음
      }
      
      return res.status(200).json({ 
        success: true, 
        deleted: result.deleted,
        deletedCount: result.deletedCount 
      });
    }
    return res.status(500).json({ success: false, error: result.error || 'Folder delete failed' });
  } catch (err) {
    console.error('rag-delete-folder API error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + (err?.message || String(err)) });
  }
}
