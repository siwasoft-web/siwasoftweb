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
      const chroma = req.query.chroma;
      const url = chroma ? `${EMB_API_BASE}/collections?chroma=${encodeURIComponent(chroma)}` : `${EMB_API_BASE}/collections`;
      console.log('Fetching collections from:', url);
      
      try {
        // FastAPI 서버에서 컬렉션 목록 조회
        const response = await fetch(url);
        console.log('FastAPI response status:', response.status);
        console.log('FastAPI response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('FastAPI response (텍스트):', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('FastAPI response data:', data);
          console.log('조회된 컬렉션들:', data.collections);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          console.error('응답 텍스트:', responseText);
          return res.status(500).json({ 
            success: false, 
            error: 'Invalid JSON response from FastAPI: ' + responseText.substring(0, 100)
          });
        }
        
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
      
      const chroma = req.query.chroma;
      console.log('컬렉션 생성 요청:', {
        name: collectionName,
        chroma
      });

      const response = await fetch(`${EMB_API_BASE}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: collectionName,
          chroma: chroma || undefined,
          metadata: { "hnsw:space": "cosine" }
        })
      });

      const responseText = await response.text();
      console.log('컬렉션 생성 응답 (텍스트):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('컬렉션 생성 응답 (JSON):', data);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('응답 텍스트:', responseText);
        return res.status(500).json({ 
          success: false, 
          error: 'Invalid JSON response from FastAPI: ' + responseText.substring(0, 100)
        });
      }
      
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

      const chroma = req.query.chroma;
      const deleteUrl = chroma
        ? `${EMB_API_BASE}/collections?name=${encodeURIComponent(id)}&chroma=${encodeURIComponent(chroma)}`
        : `${EMB_API_BASE}/collections?name=${encodeURIComponent(id)}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });

      const responseText = await response.text();
      console.log('컬렉션 삭제 응답 (텍스트):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('컬렉션 삭제 응답 (JSON):', data);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('응답 텍스트:', responseText);
        return res.status(500).json({ 
          success: false, 
          error: 'Invalid JSON response from FastAPI: ' + responseText.substring(0, 100)
        });
      }
      
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
