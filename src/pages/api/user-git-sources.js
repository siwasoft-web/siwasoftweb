import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { ObjectId } from 'mongodb';

const DBName = process.env.DB_NAME || 'siwasoftweb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const userId = session.user.email;

  try {
    const db = (await connectDB).db(DBName);
    const collection = db.collection('user_git_sources');

    if (req.method === 'GET') {
      const items = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      const mapped = items.map((i) => ({ _id: i._id.toString(), gitId: i.gitId, label: i.label || null, createdAt: i.createdAt }));
      return res.status(200).json({ success: true, items: mapped });
    }

    if (req.method === 'POST') {
      const { gitId, label } = req.body || {};
      if (!gitId || typeof gitId !== 'string' || !gitId.trim()) {
        return res.status(400).json({ success: false, error: 'gitId is required' });
      }
      const doc = {
        userId,
        gitId: gitId.trim(),
        label: label || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await collection.insertOne(doc);
      return res.status(200).json({ success: true, id: result.insertedId.toString() });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'id required' });
      const result = await collection.deleteOne({ _id: new ObjectId(id), userId });
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('user-git-sources API error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


