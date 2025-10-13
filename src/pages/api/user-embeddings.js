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
    const collection = db.collection('user_embeddings');

    if (req.method === 'GET') {
      const items = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      const mapped = items.map((i) => ({ ...i, _id: i._id.toString() }));
      return res.status(200).json({ success: true, items: mapped });
    }

    if (req.method === 'POST') {
      const { title, content, sourceLabel } = req.body || {};
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ success: false, error: 'Content is required' });
      }
      const doc = {
        userId,
        title: title || '임베딩 소스',
        content,
        sourceLabel: sourceLabel || null,
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
    console.error('user-embeddings API error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}


