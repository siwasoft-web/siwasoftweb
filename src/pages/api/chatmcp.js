// Next.js API Routes에서 body parser 설정
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  console.log('=== ChatMCP API called ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 JSON body 파싱 시작...');
    console.log('📥 Content-Length:', req.headers['content-length']);
    
    // Next.js Pages Router에서는 bodyParser 설정 시 req.body가 자동으로 파싱됨
    let body = req.body;
    
    console.log('📥 req.body 존재 여부:', !!body);
    console.log('📥 req.body 타입:', typeof body);
    console.log('📥 req.body 키:', body ? Object.keys(body) : []);
    console.log('📥 req.body 내용 (첫 200자):', body ? JSON.stringify(body).substring(0, 200) : '없음');
    
    // body가 없거나 빈 객체인 경우 에러
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      console.error('❌ req.body가 없거나 비어있음');
      // bodyParser가 작동하지 않았을 수 있으므로, 수동으로 파싱 시도
      // 하지만 이미 스트림이 종료되었을 수 있음
      return res.status(400).json({ 
        error: 'Request body is required',
        details: 'Body parser may not be working. Check Next.js configuration.'
      });
    }
    
    const { query, tool, with_answer, imageBase64, imageName, imageType } = body;
    
    console.log('📥 ChatMCP API 요청 받음:');
    console.log('  - tool:', tool);
    console.log('  - hasImage:', !!imageBase64);
    console.log('  - imageBase64 길이:', imageBase64 ? imageBase64.length : 0);
    console.log('  - imageName:', imageName);
    console.log('  - imageType:', imageType);
    console.log('  - query:', query || '없음');
    console.log('  - with_answer:', with_answer);

    if (!tool || !['chatbot', 'embed', 'gitagent', 'nerp', 'epdimg'].includes(tool)) {
      console.error('❌ 잘못된 tool:', tool);
      return res.status(400).json({ error: 'Tool must be one of: "chatbot", "embed", "gitagent", "nerp", "epdimg"' });
    }
    
    // epdimg 모드가 아닐 때는 query 필수
    if (tool !== 'epdimg' && !query) {
      console.error('❌ Query가 없습니다.');
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // epdimg 모드일 때는 이미지 base64 필수
    if (tool === 'epdimg' && !imageBase64) {
      console.error('❌ 이미지 데이터가 없습니다.');
      return res.status(400).json({ error: 'Image data is required for epdimg mode' });
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

    // epdimg 모드일 때는 FormData로 이미지 전송
    let response;
    if (tool === 'epdimg' && imageBase64) {
      console.log('🖼️ EPDIMG 모드 - FormData 준비 시작...');
      try {
        const FormData = require('form-data');
        console.log('✅ form-data 모듈 로드 성공');
        
        const formData = new FormData();
        
        // base64를 Buffer로 변환
        if (!imageBase64 || imageBase64.length === 0) {
          throw new Error('이미지 데이터가 비어있습니다.');
        }
        
        console.log('🔄 Base64를 Buffer로 변환 중...');
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        if (imageBuffer.length === 0) {
          throw new Error('이미지 버퍼 변환 실패');
        }
        console.log('✅ Buffer 변환 완료, 크기:', imageBuffer.length);
        
        formData.append('file', imageBuffer, {
          filename: imageName || 'image.jpg',
          contentType: imageType || 'image/jpeg'
        });
        console.log('✅ 파일 필드 추가 완료');
        
        // 텍스트가 있으면 함께 전송
        if (query) {
          formData.append('query', query);
          console.log('✅ 쿼리 필드 추가 완료:', query);
        }
        
        console.log('📤 EPDIMG로 이미지 전송 시작:', {
          filename: imageName,
          mimetype: imageType,
          size: imageBuffer.length,
          hasQuery: !!query,
          url: url
        });
        
        const headers = formData.getHeaders();
        console.log('📤 FormData headers:', JSON.stringify(headers, null, 2));
        
        // Node.js의 fetch는 form-data 패키지와 직접 호환되지 않을 수 있음
        // 따라서 form-data를 스트림으로 전송하거나, 다른 HTTP 클라이언트 사용
        // 여기서는 form-data의 스트림을 직접 전달
        const https = require('https');
        const http = require('http');
        const { URL } = require('url');
        
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        // 타임아웃 설정 (5분)
        const timeout = 5 * 60 * 1000;
        
        response = await new Promise((resolve, reject) => {
          const req = client.request({
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: headers,
            timeout: timeout
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              // Response 객체와 유사한 객체 생성
              const responseObj = {
                status: res.statusCode,
                statusText: res.statusMessage,
                ok: res.statusCode >= 200 && res.statusCode < 300,
                headers: res.headers,
                text: async () => data,
                json: async () => {
                  try {
                    return JSON.parse(data);
                  } catch (e) {
                    throw new Error(`JSON 파싱 실패: ${e.message}, 데이터: ${data.substring(0, 200)}`);
                  }
                }
              };
              resolve(responseObj);
            });
          });
          
          req.on('error', (err) => {
            console.error('❌ HTTP 요청 오류:', err);
            reject(err);
          });
          
          req.on('timeout', () => {
            console.error('⏱️ 요청 타임아웃 (5분)');
            req.destroy();
            reject(new Error('요청 시간 초과 (5분)'));
          });
          
          // form-data 스트림을 요청에 파이프
          formData.pipe(req);
        });
        
        console.log('✅ HTTP 요청 완료, 상태:', response.status);
      } catch (formDataError) {
        console.error('❌ FormData 전송 오류:', formDataError);
        console.error('❌ Error name:', formDataError.name);
        console.error('❌ Error message:', formDataError.message);
        console.error('❌ Error stack:', formDataError.stack);
        return res.status(500).json({ 
          error: '이미지 전송 실패', 
          details: formDataError.message,
          stack: process.env.NODE_ENV === 'development' ? formDataError.stack : undefined
        });
      }
    } else {
      // 기존 방식: URLSearchParams로 전송
      const body = new URLSearchParams({
        query: query
      });

      // embed, gitagent 또는 nerp 모드일 때 with_answer 파라미터 추가
      if (tool === 'embed' || tool === 'gitagent' || tool === 'nerp') {
        body.append('with_answer', with_answer ? 'true' : 'false');
      }

      console.log('Request body params:', body.toString());

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body
      });
    }

    console.log('FastAPI response status:', response.status);
    // response.headers가 일반 객체인 경우와 Headers 객체인 경우 처리
    if (response.headers && typeof response.headers.entries === 'function') {
      console.log('FastAPI response headers:', Object.fromEntries(response.headers.entries()));
    } else {
      console.log('FastAPI response headers:', response.headers);
    }

    // Response body를 한 번만 읽기 위해 먼저 텍스트로 변환
    let responseText;
    try {
      responseText = typeof response.text === 'function' ? await response.text() : response.text;
      console.log('📥 Raw response (첫 500자):', responseText ? responseText.substring(0, 500) : '비어있음');
    } catch (textError) {
      console.error('❌ Response text 읽기 오류:', textError);
      throw new Error(`응답 읽기 실패: ${textError.message}`);
    }

    if (!response.ok) {
      console.error('❌ FastAPI error response:', responseText);
      console.error('❌ Error status:', response.status);
      throw new Error(`Backend API error: ${response.status} - ${responseText}`);
    }

    if (!responseText) {
      throw new Error('응답이 비어있습니다.');
    }

    let data;
    try {
      // response.json()이 함수인 경우와 이미 파싱된 객체인 경우 처리
      if (typeof response.json === 'function') {
        // 이미 text()를 호출했으므로 json()은 사용할 수 없음
        data = JSON.parse(responseText);
      } else {
        data = JSON.parse(responseText);
      }
      console.log('✅ JSON 파싱 완료');
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      console.error('❌ Response text:', responseText ? responseText.substring(0, 500) : '비어있음');
      throw new Error(`응답 파싱 실패: ${parseError.message}`);
    }
    
    // 디버깅을 위한 로깅
    console.log(`${tool.toUpperCase()} API Response:`, JSON.stringify(data, null, 2));
    
    // epdimg 모드일 때: app.py의 /epdimg는 이미 chatbot_seq_logic을 호출하여 최종 답변을 반환
    // 따라서 추가 처리 없이 그대로 반환
    if (tool === 'epdimg') {
      console.log('✅ EPDIMG 응답 받음 (이미 최종 답변 포함):', JSON.stringify(data, null, 2));
      // app.py에서 반환하는 형식: { success, extracted_text, chatbot_result, response, ... }
      // response 필드에 최종 답변이 있으므로 그대로 반환
      return res.status(200).json(data);
    }
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ ChatMCP API Error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // 에러 응답 반환 보장
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to get response from backend',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      console.error('⚠️ 응답이 이미 전송되었습니다.');
    }
  }
}
