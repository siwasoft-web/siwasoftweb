import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// 사용자 세션(DB for auth)과 프로젝트(DB for project_code)가 다릅니다
const USER_DB_NAME = process.env.DB_NAME || 'siwasoftweb';
const PROJECT_DB_NAME = process.env.PROJECT_DB_NAME || 'siwasoft';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, error: 'Missing user email' });
    }

    const client = await connectDB;
    // 인증은 next-auth로 처리하므로, 컬렉션 조회만 프로젝트 DB로 진행
    const projectsDb = client.db(PROJECT_DB_NAME);
    const collection = projectsDb.collection('project_code');

    // Match your schema: USER_INFO is an array of emails, CREATED_BY is creator email.
    const email = String(userEmail);
    const query = {
      $or: [
        { USER_INFO: email }, // in case it's stored as single string
        { USER_INFO: { $in: [email] } }, // array of emails
        { CREATED_BY: email }, // creator
      ],
    };

    const docs = await collection
      .find(query)
      .sort({ updated_at: -1 })
      .toArray();

    // Normalize minimal fields used by UI
    const data = docs.map((d) => ({
      _id: d._id?.toString?.() || d._id,
      PROJECT_CODE: d.PROJECT_CODE ?? d.project_code ?? d.code ?? d._id?.toString?.() ?? '',
      PROJECT_TITLE: d.PROJECT_TITLE ?? d.project_title ?? d.title ?? '',
      SITE_CODE: d.SITE_CODE ?? d.site_code ?? '',
      SITE_NAME: d.SITE_NAME ?? d.site_name ?? d.site ?? '',
      USER_INFO: Array.isArray(d.USER_INFO)
        ? d.USER_INFO
        : (typeof d.USER_INFO === 'string' && d.USER_INFO.length > 0)
        ? [d.USER_INFO]
        : [],
      CREATED_BY: d.CREATED_BY ?? d.created_by ?? '',
      updated_date: d.updated_date ?? d.updated_at ?? d.updatedAt ?? d.created_at ?? d.createdAt ?? '',
      raw: d,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('projects-by-user error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


