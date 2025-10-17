import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { execFile } from 'child_process';
import { promisify } from 'util';

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
      return res.status(200).json({ success: true, deleted: result.deleted });
    }
    return res.status(500).json({ success: false, error: result.error || 'Delete failed' });
  } catch (err) {
    console.error('rag-delete-document API error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error: ' + (err?.message || String(err)) });
  }
}


