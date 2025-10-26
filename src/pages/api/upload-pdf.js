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

    // Base64로 인코딩된 파일 데이터를 디코딩 (PDF 또는 이미지)
    let base64Data, targetDir, fileExtension;
    
    if (file.startsWith('data:application/pdf;base64,')) {
      base64Data = file.replace(/^data:application\/pdf;base64,/, '');
      targetDir = '/home/siwasoft/siwasoft/mcp/pdf';
      fileExtension = '.pdf';
    } else if (file.startsWith('data:image/')) {
      // 이미지 파일 처리
      const matches = file.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (matches) {
        const imageType = matches[1];
        base64Data = matches[2];
        targetDir = '/home/siwasoft/siwasoft/mcp/img';
        fileExtension = `.${imageType}`;
      } else {
        throw new Error('Invalid image format');
      }
    } else {
      throw new Error('Unsupported file format');
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 원본 파일명 사용 (안전성을 위해 경로 조작 방지)
    const originalFilename = filename || `upload_${Date.now()}${fileExtension}`;
    const safeFilename = path.basename(originalFilename).replace(/[^a-zA-Z0-9._\u3131-\u3163\uac00-\ud7a3-]/g, '_');

    // 환경 확인: Vercel 배포 환경인지 체크
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      // Vercel 환경: 우리 서버에 파일 저장 (기존 방식과 동일)
      console.log('Vercel 환경: 우리 서버에 파일 저장');
      
      // 우리 서버에 직접 파일 저장 요청
      const serverUrl = process.env.OCR_API_BASE || 'http://221.139.227.131:8001';
      const saveResponse = await fetch(`${serverUrl}/save-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: safeFilename,
          file_data: base64Data,
          target_dir: targetDir
        })
      });

      if (!saveResponse.ok) {
        console.error('서버 파일 저장 실패:', saveResponse.status);
        // 저장 실패 시에도 계속 진행 (우리 서버에서 처리)
      }

      res.status(200).json({ 
        success: true, 
        filename: safeFilename,
        originalFilename: originalFilename,
        path: path.join(targetDir, safeFilename), // 예상 경로
        isVercel: true
      });
    } else {
      // 로컬 환경에서는 기존 방식대로 파일 저장
      const targetPath = path.join(targetDir, safeFilename);

      // 대상 폴더가 없으면 생성
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 파일 저장
      fs.writeFileSync(targetPath, buffer);

      res.status(200).json({ 
        success: true, 
        filename: safeFilename,
        originalFilename: originalFilename,
        path: targetPath,
        isVercel: false
      });
    }

  } catch (error) {
    console.error('PDF 업로드 오류:', error);
    res.status(500).json({ error: 'PDF 업로드 실패' });
  }
}
