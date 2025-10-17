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
    const { collection, project, chroma } = req.query;
    if (!collection || !project) {
      return res.status(400).json({ success: false, error: 'Collection and project are required' });
    }

    const chromaPath = chroma || CHROMA_PATH_DEFAULT;

    const pythonScript = `
import sys, json
try:
    import chromadb
except Exception as e:
    print(json.dumps({"ok": False, "error": "chromadb import failed: " + str(e)}))
    sys.exit(1)

def main():
    chroma_path = sys.argv[1]
    collection_name = sys.argv[2]
    project_name = sys.argv[3]
    try:
        client = chromadb.PersistentClient(path=chroma_path)
        collection_obj = client.get_collection(collection_name)
        
        # 프로젝트와 관련된 모든 문서 ID 찾기
        # ID 패턴: "project:FILE:...", "project:FOLDER:...", "project:PROJECT:..."
        results = collection_obj.get(include=["metadatas"])
        project_ids = []
        
        if results and results.get("ids"):
            for doc_id in results.get("ids", []):
                if doc_id.startswith(project_name + ":"):
                    project_ids.append(doc_id)
        
        if not project_ids:
            print(json.dumps({"ok": True, "deleted_count": 0, "message": "No documents found for project"}))
            return
        
        # 프로젝트 관련 문서들 삭제
        collection_obj.delete(ids=project_ids)
        print(json.dumps({"ok": True, "deleted_count": len(project_ids), "deleted_ids": project_ids}))
        
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))

if __name__ == "__main__":
    main()
`.trim();

    const { stdout, stderr } = await execFileAsync(
      'python3',
      ['-c', pythonScript, chromaPath, String(collection), String(project)],
      { maxBuffer: 1024 * 1024 * 10 }
    );

    if (stderr) console.error('Python script stderr:', stderr);

    const lines = String(stdout).trim().split('\n');
    const result = JSON.parse(lines[lines.length - 1]);

    if (result.ok) {
      // 프로젝트 삭제 성공 시 상태 파일에서 해당 프로젝트 제거
      let stateFileUpdated = false;
      try {
        const safeCollectionName = collection.replace(/[^a-zA-Z0-9_-]/g, '_');
        const stateFileName = `github_repos_state_${safeCollectionName}.json`;
        const stateFilePath = path.join(chromaPath, stateFileName);
        
        if (fs.existsSync(stateFilePath)) {
          // 상태 파일 읽기
          const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
          let updatedData = null;
          
          // 처리된 레포지토리 목록에서 해당 프로젝트 제거 (부분 매칭 지원)
          if (Array.isArray(stateData)) {
            const originalLength = stateData.length;
            updatedData = stateData.filter(repo => {
              // 정확한 매칭 또는 부분 매칭 (repo가 project로 끝나는 경우)
              return repo !== project && !repo.endsWith(`/${project}`);
            });
            if (updatedData.length !== originalLength) {
              fs.writeFileSync(stateFilePath, JSON.stringify(updatedData, null, 2));
              stateFileUpdated = true;
              console.log(`Removed project "${project}" from state file: ${stateFilePath}`);
            }
          } else if (stateData && Array.isArray(stateData.repos)) {
            const originalLength = stateData.repos.length;
            stateData.repos = stateData.repos.filter(repo => {
              // 정확한 매칭 또는 부분 매칭 (repo가 project로 끝나는 경우)
              return repo !== project && !repo.endsWith(`/${project}`);
            });
            if (stateData.repos.length !== originalLength) {
              fs.writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));
              stateFileUpdated = true;
              console.log(`Removed project "${project}" from state file: ${stateFilePath}`);
            }
          }
          
        } else {
          console.log(`State file not found: ${stateFilePath}`);
        }
        
      } catch (fileError) {
        console.error('Error updating state file:', fileError);
        // 파일 업데이트 실패 시에도 ChromaDB 삭제는 성공했으므로 경고만 출력
        console.warn('Warning: State file update failed, but ChromaDB deletion succeeded');
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Project deleted successfully', 
        deletedCount: result.deleted_count,
        deletedIds: result.deleted_ids || [],
        stateFileUpdated: stateFileUpdated
      });
    } else {
      return res.status(500).json({ success: false, error: result.error || 'Failed to delete project from ChromaDB' });
    }

  } catch (err) {
    console.error('rag-delete-project API error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + (err?.message || String(err))
    });
  }
}
