// path: src/pages/api/file-upload.js
// 파일 업로드 프록시 API

import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // multipart/form-data 처리
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // formidable로 파일 파싱
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file || !files.file[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = files.file[0];
    
    // 파일을 읽어서 Buffer로 변환
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    // 파일 업로드 서버로 전송 (Node.js fetch 사용)
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: uploadedFile.originalFilename,
      contentType: uploadedFile.mimetype
    });

    const uploadResponse = await fetch('http://221.139.227.131:8003/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload server error');
    }

    const result = await uploadResponse.json();
    
    // 임시 파일 삭제
    fs.unlinkSync(uploadedFile.filepath);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    });
  }
}
