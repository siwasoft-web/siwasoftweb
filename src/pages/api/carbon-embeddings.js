import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

const EMB_API_BASE = process.env.EMB_API_BASE || 'http://localhost:8001';
const TARGET_DIR = process.env.CARBON_TARGET_DIR || '/home/siwasoft/siwasoft/mcp/carbon';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    // 파일을 버퍼로 변환
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    
    // TARGET_DIR이 존재하는지 확인하고 없으면 생성
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }
    
    // 파일명 중복 방지
    let filepath = path.join(TARGET_DIR, filename);
    let counter = 1;
    while (fs.existsSync(filepath)) {
      const nameWithoutExt = path.parse(filename).name;
      const ext = path.parse(filename).ext;
      const newFilename = `${nameWithoutExt}_${counter}${ext}`;
      filepath = path.join(TARGET_DIR, newFilename);
      counter++;
    }
    
    // 파일 저장
    fs.writeFileSync(filepath, buffer);
    console.log(`Carbon file saved to: ${filepath}`);

    // FastAPI 서버의 /carbonemb 엔드포인트 호출
    const response = await fetch(`${EMB_API_BASE}/carbonemb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filepath: filepath,
        collection: 'carbon_emissions',
        chroma: process.env.CHROMA_PATH || '/home/siwasoft/siwasoft/mcp/chroma',
        outdir: process.env.OUTPUT_DIR || '/home/siwasoft/siwasoft/mcp/out',
        archive: true,
        archive_dir: process.env.ARCHIVE_DIR || '/home/siwasoft/siwasoft/mcp/end',
        chunk_tokens: 1000,
        chunk_overlap: 200
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Carbon emissions embedding completed successfully',
        collection: data.collection,
        embedded: data.embedded
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to process carbon emissions embedding' 
      });
    }

  } catch (err) {
    console.error('carbon-embeddings API error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}
