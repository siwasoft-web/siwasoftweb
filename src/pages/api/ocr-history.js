// path: src/pages/api/ocr-history.js
// lang: javascript

import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const DBName = process.env.DB_NAME || 'siwasoftweb';

export default async function handler(req, res) {
  console.log('OCR History API called:', req.method);
  
  // 사용자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const userId = session.user.email;
  console.log('User ID:', userId);
  
  if (req.method === 'POST') {
    // OCR 작업 결과 저장
    try {
      const { filename, tool, extractedText, extractedTable, originalFilename } = req.body;
      
      if (!filename || !tool || !extractedText) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('ocr_history');
      
      // 세션 ID 생성 (타임스탬프 + 랜덤)
      const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 데이터베이스에 메타데이터 저장
      const ocrRecord = {
        _id: sessionId,
        userId: userId,
        originalFilename: originalFilename || filename,
        processedFilename: filename,
        tool: tool, // 'pdf' or 'img'
        extractedText: extractedText,
        extractedTable: extractedTable || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        fileSize: extractedText.length + (extractedTable ? extractedTable.length : 0)
      };
      
      await collection.insertOne(ocrRecord);
      
      res.status(200).json({
        success: true,
        sessionId: sessionId,
        message: 'OCR 작업 결과가 저장되었습니다'
      });
      
    } catch (error) {
      console.error('Error saving OCR result:', error);
      res.status(500).json({ success: false, error: 'Failed to save OCR result' });
    }
  }
  
  else if (req.method === 'GET') {
    // OCR 작업 이력 조회
    try {
      const db = (await connectDB).db(DBName);
      const collection = db.collection('ocr_history');
      
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const history = await collection
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
      
      const total = await collection.countDocuments({ userId: userId });
      
      res.status(200).json({
        success: true,
        history: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Error fetching OCR history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch OCR history' });
    }
  }
  
  else if (req.method === 'DELETE') {
    // OCR 작업 결과 삭제
    try {
      const { sessionId } = req.query;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('ocr_history');
      
      if (!sessionId) {
        // 세션 ID가 없으면 해당 사용자 전체 기록 삭제
        const deleteResult = await collection.deleteMany({ userId: userId });
        return res.status(200).json({
          success: true,
          deletedCount: deleteResult.deletedCount || 0,
          message: '모든 OCR 작업 결과가 삭제되었습니다'
        });
      } else {
        // 단일 세션 삭제
        // 사용자 소유 확인
        const record = await collection.findOne({ _id: sessionId, userId: userId });
        if (!record) {
          return res.status(404).json({ success: false, error: 'Record not found' });
        }
        
        // 데이터베이스에서 삭제
        await collection.deleteOne({ _id: sessionId, userId: userId });
        
        return res.status(200).json({
          success: true,
          message: 'OCR 작업 결과가 삭제되었습니다'
        });
      }
      
    } catch (error) {
      console.error('Error deleting OCR result:', error);
      res.status(500).json({ success: false, error: 'Failed to delete OCR result' });
    }
  }
  
  else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
