import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const DBName = process.env.DB_NAME || 'siwasoftweb';

// GET: 특정 채팅방의 메시지 조회
// POST: 새 메시지 추가
// PUT: 메시지 업데이트 (생각 중 메시지 제거 후 실제 응답으로 교체)
export default async function handler(req, res) {
  const { sessionId } = req.query;

  // 사용자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const userId = session.user.email; // 사용자 이메일을 ID로 사용

  if (req.method === 'GET') {
    try {
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const { ObjectId } = require('mongodb');
      const session = await collection.findOne({ _id: new ObjectId(sessionId), userId: userId });

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.status(200).json({
        success: true,
        messages: session.messages || [],
        session: {
          _id: session._id.toString(),
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
  }

  else if (req.method === 'POST') {
    try {
      const { message } = req.body;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const { ObjectId } = require('mongodb');
      
      // 새 메시지 추가
      const result = await collection.updateOne(
        { _id: new ObjectId(sessionId), userId: userId },
        {
          $push: { messages: message },
          $set: {
            lastMessage: message.text,
            updatedAt: new Date()
          },
          $inc: { messageCount: 1 }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.status(200).json({ success: true, message });
    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({ success: false, error: 'Failed to add message' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const { thinkingMessageId, newMessage } = req.body;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('chat_sessions');

      const { ObjectId } = require('mongodb');
      
      // 생각 중 메시지를 실제 응답으로 교체
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(sessionId),
          userId: userId,
          'messages.id': thinkingMessageId
        },
        {
          $set: {
            'messages.$': newMessage,
            lastMessage: newMessage.text,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Session or message not found' });
      }

      res.status(200).json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ success: false, error: 'Failed to update message' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
