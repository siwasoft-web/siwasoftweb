// Google Vision API를 사용하여 이미지에서 텍스트 추출
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, imageUrl } = req.body;

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: 'imageBase64 or imageUrl is required' });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GOOGLE_VISION_API_KEY is not configured' });
    }

    // Google Vision API 요청 구성
    const requestBody = {
      requests: [
        {
          image: imageBase64 
            ? { content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '') }
            : { source: { imageUri: imageUrl } },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            }
          ]
        }
      ]
    };

    // Google Vision API 호출
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error:', errorText);
      throw new Error(`Google Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    
    if (visionData.responses && visionData.responses.length > 0) {
      const response = visionData.responses[0];
      
      // 텍스트 추출
      let extractedText = '';
      if (response.textAnnotations && response.textAnnotations.length > 0) {
        // 첫 번째 요소는 전체 텍스트
        extractedText = response.textAnnotations[0].description || '';
      }

      // 객체 인식 결과에서 라벨 추출
      let objectLabels = [];
      if (response.localizedObjectAnnotations) {
        objectLabels = response.localizedObjectAnnotations.map(obj => obj.name).join(' ');
      }

      // 제품명과 제조사 추출 시도
      // 텍스트에서 제품명과 제조사를 찾기 위한 간단한 패턴 매칭
      let productName = '';
      let manufacturer = '';
      
      // 일반적인 제조사 패턴
      const manufacturerPatterns = [
        /(삼성|Samsung|LG|엘지|Apple|애플|Sony|소니|Panasonic|파나소닉|Hyundai|현대|Kia|기아|SK|에스케이|KT|케이티|Lotte|롯데|CJ|씨제이)/gi
      ];
      
      // 제품명 패턴 (모델명, 제품명 등)
      const productPatterns = [
        /([A-Z]{2,3}-?\d{3,4}[A-Z]?)/g, // 모델명 패턴 (예: SM-G998, iPhone14)
        /([가-힣]+제품|[가-힣]+기기|[가-힣]+장비)/g
      ];

      // 제조사 찾기
      for (const pattern of manufacturerPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          manufacturer = match[0];
          break;
        }
      }

      // 제품명 찾기
      for (const pattern of productPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          productName = match[0];
          break;
        }
      }

      // 검색에 사용할 텍스트 구성
      // 제품명, 제조사, 추출된 텍스트를 조합
      const searchText = [manufacturer, productName, extractedText, objectLabels]
        .filter(Boolean)
        .join(' ')
        .trim();

      return res.status(200).json({
        success: true,
        extractedText: searchText || extractedText,
        productName: productName || null,
        manufacturer: manufacturer || null,
        fullText: extractedText,
        objectLabels: objectLabels.length > 0 ? objectLabels : null
      });
    } else {
      return res.status(200).json({
        success: true,
        extractedText: '',
        productName: null,
        manufacturer: null,
        fullText: '',
        objectLabels: null
      });
    }
  } catch (error) {
    console.error('Vision extraction error:', error);
    return res.status(500).json({
      error: 'Failed to extract text from image',
      details: error.message
    });
  }
}

