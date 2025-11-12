import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  console.log('ChatMCP API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, tool, with_answer } = req.body;
    console.log('📥 ChatMCP API 요청 받음:');
    console.log('  - tool:', tool);
    console.log('  - query 길이:', query ? query.length : 0);
    console.log('  - query (첫 200자):', query ? query.substring(0, 200) : '없음');
    console.log('  - with_answer:', with_answer);
    
    if (!query) {
      console.error('❌ Query가 없습니다.');
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!tool || !['chatbot', 'embed', 'gitagent', 'nerp', 'epdimg'].includes(tool)) {
      console.error('❌ 잘못된 tool:', tool);
      return res.status(400).json({ error: 'Tool must be one of: "chatbot", "embed", "gitagent", "nerp", "epdimg"' });
    }
    
    console.log('✅ 요청 검증 통과, tool:', tool);

    // FastAPI 백엔드 엔드포인트 결정 (환경 변수 우선, fallback으로 IP 사용)
    const endpoint = tool === 'chatbot' ? '/chatbot' 
                   : tool === 'embed' ? '/embed' 
                   : tool === 'gitagent' ? '/gitagent' 
                   : tool === 'nerp' ? '/nerp'
                   : tool === 'epdimg' ? '/epdimg'
                   : '/chatbot';
    const baseUrl = process.env.API_BASE_URL || 'http://221.139.227.131:8000';
    const url = `${baseUrl}${endpoint}`;
    console.log('Calling FastAPI endpoint:', url);
    
    // epdimg 모드일 때 전달되는 쿼리 로그 출력
    if (tool === 'epdimg') {
      console.log('🔍 EPDIMG로 전달되는 이미지 검색 결과 텍스트:');
      console.log('📝 Query (첫 500자):', query.substring(0, 500));
      console.log('📏 Query 길이:', query.length);
    }

    // 요청 바디 구성
    const body = new URLSearchParams({
      query: query
    });

    // embed, gitagent 또는 nerp 모드일 때 with_answer 파라미터 추가
    if (tool === 'embed' || tool === 'gitagent' || tool === 'nerp') {
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
    
      // epdimg 모드일 때: 응답을 받아서 제품명, 제조사, 사이즈를 추출하고 /chatbot으로 재전달
    if (tool === 'epdimg') {
      console.log('🔍 EPDIMG 응답 받음, 제품 정보 추출 후 /chatbot으로 전달');
      console.log('📦 EPDIMG 원본 응답:', JSON.stringify(data, null, 2));
      
      // epdimg 응답에서 제품명, 제조사, 사이즈 추출
      let extractedText = '';
      
      // 응답 형식에 따라 처리 (JSON 객체 또는 텍스트)
      if (typeof data === 'object') {
        const parts = [];
        if (data.productName || data.product_name) {
          parts.push(`제품명: ${data.productName || data.product_name}`);
        }
        if (data.manufacturer || data.manufacturer_name) {
          parts.push(`제조사: ${data.manufacturer || data.manufacturer_name}`);
        }
        if (data.size || data.size_info) {
          parts.push(`사이즈: ${data.size || data.size_info}`);
        }
        
        // 구조화된 데이터가 있으면 텍스트로 변환
        if (parts.length > 0) {
          extractedText = parts.join(', ');
          console.log('✅ 구조화된 제품 정보 추출:', parts);
        } else if (data.response || data.answer || data.text) {
          // 응답에 직접 텍스트가 있는 경우
          extractedText = data.response || data.answer || data.text;
          console.log('✅ 응답 텍스트 사용:', extractedText);
        } else {
          // JSON 전체를 문자열로 변환
          extractedText = JSON.stringify(data);
          console.log('⚠️ JSON 전체를 텍스트로 변환:', extractedText.substring(0, 200));
        }
      } else if (typeof data === 'string') {
        extractedText = data;
        console.log('✅ 문자열 응답 사용:', extractedText.substring(0, 200));
      }
      
      if (!extractedText) {
        console.warn('⚠️ EPDIMG에서 추출된 텍스트가 없습니다.');
        console.warn('⚠️ EPDIMG 원본 응답:', data);
        return res.status(200).json({
          ...data,
          message: 'EPDIMG에서 제품 정보를 추출할 수 없습니다.'
        });
      }
      
      // 1줄 정규화: "제품명:" 포함된 첫 줄 우선, 없으면 첫 비어있지 않은 줄
      const normalizeSingleLine = (txt) => {
        if (!txt) return '';
        // 코드블록 제거
        txt = txt.replace(/```[\s\S]*?```/g, ' ');
        const lines = txt.split('\n').map(s => s.trim());
        const firstWithKey = lines.find(ln => ln.includes('제품명:'));
        const candidate = firstWithKey || lines.find(ln => ln.length > 0) || '';
        return candidate.replace(/\s+/g, ' ').replace(/[ ,;]+$/g, '');
      };
      extractedText = normalizeSingleLine(extractedText);
      
      console.log('✅ 추출된 제품 정보 텍스트(정규화):', extractedText);
      
      // 추출된 텍스트를 /chatbot 엔드포인트로 전달
      const chatbotUrl = `${baseUrl}/chatbot`;
      console.log('🔄 /chatbot으로 재전달:', chatbotUrl);
      
      const chatbotBody = new URLSearchParams({
        query: extractedText
      });
      
      const chatbotResponse = await fetch(chatbotUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: chatbotBody
      });
      
      if (!chatbotResponse.ok) {
        const errorText = await chatbotResponse.text();
        console.error('Chatbot API error response:', errorText);
        throw new Error(`Chatbot API error: ${chatbotResponse.status} - ${errorText}`);
      }
      
      const chatbotData = await chatbotResponse.json();
      console.log('✅ /chatbot 응답 받음:', JSON.stringify(chatbotData, null, 2));
      
      // epdimg 원본 응답과 chatbot 응답을 함께 반환
      return res.status(200).json({
        ...chatbotData,
        epdimgResponse: data, // 원본 epdimg 응답도 포함
        extractedProductInfo: extractedText // 추출된 제품 정보
      });
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('ChatMCP API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to get response from backend',
      details: error.message 
    });
  }
}
