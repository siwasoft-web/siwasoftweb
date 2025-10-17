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
    const { collection, chroma } = req.query;
    if (!collection) {
      return res.status(400).json({ success: false, error: 'collection parameter is required' });
    }

    const chromaPath = chroma || CHROMA_PATH_DEFAULT;

    const pythonScript = `
import sys, json
import chromadb

path = sys.argv[1]
coll = sys.argv[2]

try:
    client = chromadb.PersistentClient(path=path)
    
    # 컬렉션이 존재하는지 확인
    try:
        collection_obj = client.get_collection(coll)
        # 컬렉션의 모든 문서 개수 확인
        results = collection_obj.get()
        doc_count = len(results.get("ids", [])) if results else 0
        
        # 컬렉션 삭제
        client.delete_collection(coll)
        print(json.dumps({"ok": True, "deletedCount": doc_count, "message": f"Collection '{coll}' deleted with {doc_count} documents"}))
    except Exception as e:
        if "does not exist" in str(e):
            print(json.dumps({"ok": True, "deletedCount": 0, "message": f"Collection '{coll}' does not exist"}))
        else:
            raise e
            
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`.trim();

    const { stdout, stderr } = await execFileAsync(
      'python3',
      ['-c', pythonScript, chromaPath, String(collection)],
      { maxBuffer: 1024 * 1024 * 10 }
    );
    if (stderr) console.log('Python clear collection stderr:', stderr);

    const result = JSON.parse(String(stdout).trim().split('\n').pop());
    
    // ChromaDB 컬렉션 삭제 성공 시 상태 파일도 삭제
    if (result.ok) {
      try {
        // 컬렉션명을 안전한 파일명으로 변환
        const safeCollectionName = collection.replace(/[^a-zA-Z0-9_-]/g, '_');
        const stateFileName = `github_repos_state_${safeCollectionName}.json`;
        const stateFilePath = path.join(chromaPath, stateFileName);
        
        // 상태 파일이 존재하면 삭제
        if (fs.existsSync(stateFilePath)) {
          fs.unlinkSync(stateFilePath);
          console.log(`Deleted state file: ${stateFilePath}`);
        }
        
        // 추가로 가능한 다른 상태 파일들도 삭제
        const possibleStateFiles = [
          `github_repos_state_${safeCollectionName}.json`,
          `${collection}_state.json`,
          `${safeCollectionName}_state.json`
        ];
        
        possibleStateFiles.forEach(fileName => {
          const filePath = path.join(chromaPath, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted additional state file: ${filePath}`);
          }
        });
        
      } catch (fileError) {
        console.error('Error deleting state files:', fileError);
        // 파일 삭제 실패는 전체 작업을 실패시키지 않음
      }
      
      return res.status(200).json({ 
        success: true, 
        deletedCount: result.deletedCount,
        message: result.message
      });
    }
    return res.status(500).json({ success: false, error: result.error || 'Clear collection failed' });
  } catch (err) {
    console.error('rag-clear-collection API error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + (err?.message || String(err)) });
  }
}
