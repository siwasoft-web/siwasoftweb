import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import fs from 'fs';
import path from 'path';

const EMB_API_BASE = process.env.EMB_API_BASE || 'http://221.139.227.131:8001';
const GIT_API_BASE = process.env.GIT_API_BASE || 'http://221.139.227.131:8001';
const TARGET_DIR = process.env.RAG_TARGET_DIR || '/home/siwasoft/siwasoft/mcp/pdf';

// Git RAG 임베딩 처리 함수
async function handleGitEmbedding(req, res, { git_id, collection }) {
  if (!git_id || !git_id.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'Git ID is required' 
    });
  }

  try {
    // 외부 emb.py 서버의 /gitrag 엔드포인트로 요청 전달
    const response = await fetch(`${GIT_API_BASE}/gitrag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        git_id: git_id.trim(),
        collection_name: collection || 'github_repos',
        chroma_path: '/home/siwasoft/siwasoft/emd2'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || 'Git RAG embedding failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Git RAG embedding completed successfully',
      data: data
    });

  } catch (error) {
    console.error('Git RAG embedding error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}

// PDF RAG 임베딩 처리 함수
async function handlePdfEmbedding(req, res, { file, filename, collection }) {
  if (!file) {
    return res.status(400).json({ success: false, error: 'File is required' });
  }

  try {
    // Base64 파일을 실제 파일로 저장
    const base64Data = file.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 원본 파일명 사용 (제공되지 않은 경우에만 타임스탬프 사용)
    let originalFilename = filename || `upload_${Date.now()}.pdf`;
    
    // 파일명이 .pdf로 끝나지 않으면 .pdf 추가
    if (!originalFilename.toLowerCase().endsWith('.pdf')) {
      originalFilename += '.pdf';
    }
    
    // TARGET_DIR이 존재하는지 확인하고 없으면 생성
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }
    
    // 파일명 중복 방지
    let filepath = path.join(TARGET_DIR, originalFilename);
    let counter = 1;
    while (fs.existsSync(filepath)) {
      const nameWithoutExt = path.parse(originalFilename).name;
      const ext = path.parse(originalFilename).ext;
      const newFilename = `${nameWithoutExt}_${counter}${ext}`;
      filepath = path.join(TARGET_DIR, newFilename);
      counter++;
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
        filepath: filepath,
        collection: collection || 'default',
        chroma: process.env.CHROMA_PATH || '/home/siwasoft/siwasoft/emd',
        outdir: process.env.OUTPUT_DIR || '/home/siwasoft/siwasoft/mcp/out',
        archive: true,
        archive_dir: process.env.ARCHIVE_DIR || '/home/siwasoft/siwasoft/mcp/end',
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
    console.error('PDF embedding error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { file, filename, collection, git_id, type } = req.body;
    
    // Git RAG 임베딩 처리
    if (type === 'git' || git_id) {
      return await handleGitEmbedding(req, res, { git_id, collection });
    }
    
    // PDF RAG 임베딩 처리 (기본값)
    return await handlePdfEmbedding(req, res, { file, filename, collection });

  } catch (err) {
    console.error('rag-embedding API error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}
