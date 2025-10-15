import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

const EMB_API_BASE = process.env.EMB_API_BASE || 'http://localhost:8001';
const TARGET_DIR = '/home/siwasoft/siwasoft/mcp/pdf'; // emb.py에서 사용하는 TARGET_DIR

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { file, collection } = req.body;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    // Base64 파일을 실제 파일로 저장
    const base64Data = file.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 파일명 생성 (타임스탬프 + 원본파일명)
    const timestamp = Date.now();
    const filename = `upload_${timestamp}.pdf`;
    const filepath = path.join(TARGET_DIR, filename);
    
    // TARGET_DIR이 존재하는지 확인하고 없으면 생성
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }
    
    // 파일 저장
    fs.writeFileSync(filepath, buffer);
    console.log(`File saved to: ${filepath}`);

    // FastAPI 서버의 /pdfemb 엔드포인트 호출
    const response = await fetch(`${EMB_API_BASE}/pdfemb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection: collection || 'default',
        chroma: '/home/siwasoft/siwasoft/mcp/chroma',
        outdir: '/home/siwasoft/siwasoft/mcp/out',
        archive: true,
        archive_dir: '/home/siwasoft/siwasoft/mcp/end',
        chunk_tokens: 1000,
        chunk_overlap: 200,
        embed_raw_tables: false
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'PDF embedding completed successfully',
        collection: data.collection,
        embedded: data.embedded
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to process PDF embedding' 
      });
    }

  } catch (err) {
    console.error('rag-embedding API error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}
