import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query, with_answer } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // FastAPI 백엔드로 요청 전송
    const response = await fetch('http://localhost:8000/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        query: query,
        with_answer: with_answer ? 'true' : 'false'
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 디버깅을 위한 로깅
    console.log('Embed API Response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from embed search' },
      { status: 500 }
    );
  }
}
