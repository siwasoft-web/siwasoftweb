import { connectDB } from '@/Utils/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const EMB_API_BASE = process.env.EMB_API_BASE || 'http://localhost:8001';

export default async function handler(req, res) {
  console.log('RAG collections API called:', req.method);
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No session found');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const userId = session.user.email;
  console.log('User ID:', userId);

  try {
    if (req.method === 'GET') {
      console.log('Fetching collections from:', `${EMB_API_BASE}/collections`);
      
      try {
        // FastAPI 서버에서 컬렉션 목록 조회
        const response = await fetch(`${EMB_API_BASE}/collections`);
        console.log('FastAPI response status:', response.status);
        console.log('FastAPI response headers:', response.headers);
        
        const data = await response.json();
        console.log('FastAPI response data:', data);
        
        if (data.ok) {
          // 모든 컬렉션을 표시 (필터링 제거)
          const userCollections = data.collections.map(name => ({
            _id: name,
            name: name,
            userId: userId
          }));
          
          console.log('Processed collections:', userCollections);
          
          return res.status(200).json({ 
            success: true, 
            items: userCollections 
          });
        } else {
          console.error('FastAPI returned error:', data);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch collections from embedding service' 
          });
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to connect to embedding service: ' + fetchError.message 
        });
      }
    }

    if (req.method === 'POST') {
      // 새 컬렉션 생성
      const { name } = req.body || {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Collection name is required' });
      }

      // 컬렉션 이름 그대로 사용
      const collectionName = name.trim();

      const response = await fetch(`${EMB_API_BASE}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: collectionName,
          metadata: { "hnsw:space": "cosine" }
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        return res.status(200).json({ 
          success: true, 
          id: collectionName,
          collection: {
            _id: collectionName,
            name: collectionName,
            userId: userId
          }
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: data.error || 'Failed to create collection' 
        });
      }
    }

    if (req.method === 'DELETE') {
      // 컬렉션 삭제
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Collection ID is required' });
      }

      const response = await fetch(`${EMB_API_BASE}/collections?name=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.ok) {
        return res.status(200).json({ 
          success: true, 
          deletedCount: 1,
          deleted: id
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: data.error || 'Failed to delete collection' 
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('rag-collections API error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    });
  }
}
