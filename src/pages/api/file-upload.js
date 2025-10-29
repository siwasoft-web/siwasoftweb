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

  let uploadedFile = null;
  
  try {
    console.log('File upload request received');
    
    // formidable로 파일 파싱
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB (base64 전송 시 약 1.33배 커짐)
    });

    const [fields, files] = await form.parse(req);

    if (!files || !files.file) {
      console.log('No file found in request (files or files.file missing)');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // formidable 버전에 따라 단일 파일이 배열이 아닐 수 있음: 배열/단일 모두 처리
    const fileField = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!fileField) {
      console.log('File field empty');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    uploadedFile = fileField;
    console.log('File parsed:', uploadedFile.originalFilename);
    
    // 파일을 읽어서 Buffer로 변환
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    console.log('File buffer size:', fileBuffer.length);
    
    // Base64로 인코딩하여 전송
    const base64Data = fileBuffer.toString('base64');
    console.log('Base64 encoding completed');
    
    // 파일 업로드 서버로 전송 (Base64 방식)
    const uploadResponse = await fetch('http://221.139.227.131:8003/upload-base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Data,
        filename: uploadedFile.originalFilename,
        mimetype: uploadedFile.mimetype
      })
    });

    console.log('Upload server response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload server error:', uploadResponse.status, errorText);
      return res.status(502).json({
        success: false,
        error: 'Upload server error',
        status: uploadResponse.status,
        details: errorText
      });
    }

    const result = await uploadResponse.json();
    console.log('Upload successful:', result);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'File upload failed',
      details: error?.message || String(error) 
    });
  } finally {
    // 임시 파일 정리
    if (uploadedFile && uploadedFile.filepath) {
      try {
        fs.unlinkSync(uploadedFile.filepath);
        console.log('Temporary file cleaned up');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
}
