// path: src/pages/api/file-upload.js
// 파일 업로드 프록시 API

import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

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
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file || !files.file[0]) {
      console.log('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    uploadedFile = files.file[0];
    console.log('File parsed:', uploadedFile.originalFilename);
    
    // 파일을 읽어서 Buffer로 변환
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    console.log('File buffer size:', fileBuffer.length);
    
    // 파일 업로드 서버로 전송
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: uploadedFile.originalFilename,
      contentType: uploadedFile.mimetype
    });

    console.log('Sending to upload server...');
    const uploadResponse = await fetch('http://221.139.227.131:8003/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    console.log('Upload server response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload server error:', errorText);
      throw new Error(`Upload server error: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload successful:', result);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
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
