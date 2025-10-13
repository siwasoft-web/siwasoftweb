import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const DBName = process.env.DB_NAME || 'siwasoftweb';

// GET: 채팅방 목록 조회
export default async function handler(req, res) {
  console.log('Chat sessions API called:', req.method);
  
  // 사용자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const userId = session.user.email; // 사용자 이메일을 ID로 사용
  console.log('User ID:', userId);
  
  if (req.method === 'GET') {
    try {
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const sessions = await collection
        .find({ userId: userId })
        .sort({ updatedAt: -1 })
        .toArray();

      console.log('Raw sessions from DB:', sessions.map(s => ({ _id: s._id, title: s.title })));

      // ObjectId를 문자열로 변환
      const sessionsWithStringIds = sessions.map(session => ({
        ...session,
        _id: session._id.toString()
      }));

      console.log('Sessions with string IDs:', sessionsWithStringIds.map(s => ({ _id: s._id, title: s.title })));

      res.status(200).json({ success: true, sessions: sessionsWithStringIds });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch chat sessions' });
    }
  }

  // POST: 새 채팅방 생성
  else if (req.method === 'POST') {
    try {
      console.log('Creating new chat session:', req.body);
      const { title, firstMessage } = req.body;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const newSession = {
        userId: userId, // 사용자 ID 추가
        title: title || '새 대화',
        messages: firstMessage ? [firstMessage] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: firstMessage ? firstMessage.text : '',
        messageCount: firstMessage ? 1 : 0
      };

      const result = await collection.insertOne(newSession);
      
      res.status(200).json({
        success: true,
        session: {
          _id: result.insertedId.toString(),
          ...newSession
        }
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ success: false, error: 'Failed to create chat session' });
    }
  }

  // PUT: 채팅방 수정 (제목 변경)
  else if (req.method === 'PUT') {
    try {
      const { sessionId, title } = req.body;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const { ObjectId } = require('mongodb');
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId), userId: userId },
        { 
          $set: { 
            title,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating chat session:', error);
      res.status(500).json({ success: false, error: 'Failed to update chat session' });
    }
  }

  // DELETE: 채팅방 삭제
  else if (req.method === 'DELETE') {
    try {
      const { sessionId } = req.query;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const { ObjectId } = require('mongodb');
      const result = await collection.deleteOne({ _id: new ObjectId(sessionId), userId: userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ success: false, error: 'Failed to delete chat session' });
    }
  }

  // PATCH: 데이터베이스 정리 (개발용)
  else if (req.method === 'PATCH') {
    try {
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');
      
      // 현재 사용자의 채팅방만 삭제
      const result = await collection.deleteMany({ userId: userId });
      
      res.status(200).json({ 
        success: true, 
        message: `Deleted ${result.deletedCount} sessions for user ${userId}` 
      });
    } catch (error) {
      console.error('Error cleaning database:', error);
      res.status(500).json({ success: false, error: 'Failed to clean database' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
