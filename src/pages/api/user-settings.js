import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const DBName = process.env.DB_NAME || 'siwasoftweb';

// GET: 사용자 설정 정보 조회
// PUT: 사용자 설정 정보 업데이트
export default async function handler(req, res) {
  // 사용자 인증 확인
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const userId = session.user.email; // 사용자 이메일을 ID로 사용
  console.log('User settings API called:', req.method, 'for user:', userId);

  if (req.method === 'GET') {
    try {
      const db = (await connectDB).db(DBName);
      const collection = db.collection('user_settings');

      const userSettings = await collection.findOne({ userId: userId });

      if (!userSettings) {
        // 사용자 설정이 없으면 기본값 반환
        return res.status(200).json({
          success: true,
          settings: {
            companyName: '',
            address: '',
            managerName: '',
            managerEmail: '',
            managerPhone: '',
          }
        });
      }

      res.status(200).json({
        success: true,
        settings: {
          companyName: userSettings.companyName || '',
          address: userSettings.address || '',
          managerName: userSettings.managerName || '',
          managerEmail: userSettings.managerEmail || '',
          managerPhone: userSettings.managerPhone || '',
        }
      });
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user settings' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const { companyName, address, managerName, managerEmail, managerPhone } = req.body;
      
      const db = (await connectDB).db(DBName);
      const collection = db.collection('user_settings');

      const settingsData = {
        userId: userId,
        companyName: companyName || '',
        address: address || '',
        managerName: managerName || '',
        managerEmail: managerEmail || '',
        managerPhone: managerPhone || '',
        updatedAt: new Date()
      };

      // upsert: 사용자 설정이 없으면 생성, 있으면 업데이트
      const result = await collection.updateOne(
        { userId: userId },
        { 
          $set: settingsData,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      console.log('Settings saved:', result);

      res.status(200).json({
        success: true,
        message: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving user settings:', error);
      res.status(500).json({ success: false, error: 'Failed to save user settings' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
