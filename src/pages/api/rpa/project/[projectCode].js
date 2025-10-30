import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const PROJECT_DB_NAME = process.env.PROJECT_DB_NAME || 'siwasoft';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { projectCode } = req.query;
    if (!projectCode) {
      return res.status(400).json({ success: false, error: 'Missing projectCode' });
    }

    const client = await connectDB;
    const db = client.db(PROJECT_DB_NAME);
    const collection = db.collection('project_code');

    if (req.method === 'DELETE') {
      // 권한 확인: CREATED_BY 또는 USER_INFO(배열)에 현재 사용자 이메일 포함
      const email = String(session.user?.email || '');
      const doc = await collection.findOne({ PROJECT_CODE: Number(projectCode) });
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const userInfo = Array.isArray(doc.USER_INFO)
        ? doc.USER_INFO
        : (typeof doc.USER_INFO === 'string' && doc.USER_INFO.length > 0)
        ? [doc.USER_INFO]
        : [];

      const isOwner = doc.CREATED_BY === email;
      const isMember = userInfo.includes(email);
      if (!isOwner && !isMember) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const result = await collection.deleteOne({ PROJECT_CODE: Number(projectCode) });
      if (result.deletedCount !== 1) {
        return res.status(500).json({ success: false, error: 'Failed to delete' });
      }
      return res.status(200).json({ success: true, PROJECT_CODE: projectCode });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('DELETE project error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


