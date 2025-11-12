// 견적서 추출 API 프록시

// Body size 제한 늘리기 (최대 10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ocrServerUrl = process.env.OCR_SERVER_URL || 'http://221.139.227.131:18333';
    
    console.log('견적서 추출 요청:', {
      url: `${ocrServerUrl}/ocr`,
      dataLength: req.body.length
    });

    const response = await fetch(`${ocrServerUrl}/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    console.log('견적서 서버 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('견적서 서버 에러:', errorText);
      return res.status(response.status).json({ 
        error: '견적서 추출 실패',
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('견적서 추출 성공');

    return res.status(200).json(result);

  } catch (error) {
    console.error('견적서 추출 오류:', error);
    return res.status(500).json({ 
      error: '견적서 추출 중 오류 발생',
      details: error.message 
    });
  }
}

