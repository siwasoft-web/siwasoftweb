import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  console.log('ChatMCP API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, tool, with_answer } = req.body;
    console.log('Request body:', { query, tool, with_answer });
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!tool || !['chatbot', 'embed', 'gitagent'].includes(tool)) {
      return res.status(400).json({ error: 'Tool must be one of: "chatbot", "embed", "gitagent"' });
    }

    // FastAPI 백엔드 엔드포인트 결정
    const endpoint = tool === 'chatbot' ? '/chatbot' : tool === 'embed' ? '/embed' : '/gitagent';
    const url = `http://127.0.0.1:8000${endpoint}`;
    console.log('Calling FastAPI endpoint:', url);

    // 요청 바디 구성
    const body = new URLSearchParams({
      query: query
    });

    // embed 또는 gitagent 모드일 때 with_answer 파라미터 추가
    if (tool === 'embed' || tool === 'gitagent') {
      body.append('with_answer', with_answer ? 'true' : 'false');
    }

    console.log('Request body params:', body.toString());

    // FastAPI 백엔드로 요청 전송
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body
    });

    console.log('FastAPI response status:', response.status);
    console.log('FastAPI response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error response:', errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 디버깅을 위한 로깅
    console.log(`${tool.toUpperCase()} API Response:`, JSON.stringify(data, null, 2));
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('ChatMCP API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from backend',
      details: error.message 
    });
  }
}
