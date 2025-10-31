import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const DBName = process.env.DB_NAME || 'siwasoftweb';

export default async function handler(req, res) {
  // 인증 확인
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userEmail = session.user.email;

  if (req.method === 'GET') {
    try {
      const db = (await connectDB).db(DBName);
      const userCollection = db.collection('user');

      // 🔍 이메일 기준으로 role 조회
      const user = await userCollection.findOne({ email: userEmail });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database',
          role: 'user', // 기본값
        });
      }

      res.status(200).json({
        success: true,
        email: userEmail,
        role: user.role || 'user',
      });
    } catch (err) {
      console.error('Error fetching user role:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user role',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
