import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 클라이언트에서 FormData로 전송된 파일을 처리
    const { file, filename } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Base64로 인코딩된 파일 데이터를 디코딩
    const base64Data = file.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 원본 파일명 사용 (안전성을 위해 경로 조작 방지)
    const originalFilename = filename || `upload_${Date.now()}.pdf`;
    const safeFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9._\u3131-\u3163\uac00-\ud7a3-]/g, '_');
    const targetPath = path.join('/home/siwasoft/siwasoft/mcp/pdf', safeFilename);

    // PDF 폴더가 없으면 생성
    const pdfDir = '/home/siwasoft/siwasoft/mcp/pdf';
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // 파일 저장
    fs.writeFileSync(targetPath, buffer);

    res.status(200).json({ 
      success: true, 
      filename: safeFilename,
      originalFilename: originalFilename,
      path: targetPath 
    });

  } catch (error) {
    console.error('PDF 업로드 오류:', error);
    res.status(500).json({ error: 'PDF 업로드 실패' });
  }
}
