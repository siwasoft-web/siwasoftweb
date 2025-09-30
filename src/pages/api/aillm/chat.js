import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, roomId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 8000번 포트의 /chatbot 엔드포인트로 요청 전송
    const response = await fetch('http://localhost:8000/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        query: message
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 응답 데이터 구조 확인 및 처리
    let responseText;
    if (data.response) {
      responseText = data.response;
    } else if (data.answer) {
      responseText = data.answer;
    } else if (typeof data === 'string') {
      responseText = data;
    } else {
      responseText = JSON.stringify(data);
    }

    // 채팅 메시지 응답
    const chatResponse = {
      success: true,
      message: responseText,
      roomId: roomId || null,
      timestamp: new Date().toISOString(),
      originalData: data // 디버깅용
    };

    return res.status(200).json(chatResponse);

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from chatbot',
      details: error.message 
    });
  }
}
