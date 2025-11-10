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

      // 제품 정보 구조화 추출
      let productName = '';
      let manufacturer = '';
      let size = '';

      // 1. 사이즈/규격 추출 (숫자 + 단위 패턴)
      const sizePatterns = [
        /(\d+(?:\.\d+)?)\s*(ml|mL|ML|L|l|g|kg|KG|개|매|장|cm|mm|m|inch|인치)/gi,
        /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(cm|mm|m|inch)/gi, // 가로 x 세로
      ];
      
      for (const pattern of sizePatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          size = match[0].trim();
          break;
        }
      }

      // 2. 제조사 추출 (영문 브랜드명)
      // 알려진 브랜드명 매핑
      const brandMappings = {
        'cocacol': 'Coca-Cola',
        'coca-col': 'Coca-Cola',
        'coca cola': 'Coca-Cola',
        'cocacola': 'Coca-Cola',
        'pepsi': 'Pepsi',
        'samsung': 'Samsung',
        'lg': 'LG',
        'apple': 'Apple',
        'sony': 'Sony',
        'panasonic': 'Panasonic',
        'hyundai': 'Hyundai',
        'kia': 'Kia',
        'nike': 'Nike',
        'adidas': 'Adidas'
      };
      
      const manufacturerPatterns = [
        /(Coca-Cola|CocaCol|Coca-Col|Coca Cola|CocaCola|Pepsi|Nike|Adidas|Samsung|LG|Apple|Sony|Panasonic|Hyundai|Kia|SK|KT|Lotte|CJ|Nestle|Unilever|P&G|Procter|Gamble)/gi,
        /([A-Z][a-z]+(?:-[A-Z][a-z]+)*)\s*(?:ORIGINAL|TASTE|BRAND|CORP|INC|LTD|CO|COMPANY)/gi, // 브랜드명 + 키워드
      ];
      
      for (const pattern of manufacturerPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          let foundBrand = match[0].split(/\s+/)[0].trim();
          // 브랜드명 정규화
          const normalizedBrand = foundBrand.toLowerCase().replace(/[^a-z]/g, '');
          if (brandMappings[normalizedBrand]) {
            manufacturer = brandMappings[normalizedBrand];
          } else {
            manufacturer = foundBrand;
          }
          break;
        }
      }

      // 3. 제품명 추출 (한글 제품명 우선)
      const productNamePatterns = [
        /([가-힣]+콜라|[가-힣]+사이다|[가-힣]+음료|[가-힣]+제품|[가-힣]+식품|[가-힣]+과자|[가-힣]+빵|[가-힣]+우유|[가-힣]+주스)/g, // 한글 제품명
      ];
      
      // 한글 제품명 찾기
      for (const pattern of productNamePatterns) {
        const matches = extractedText.match(pattern);
        if (matches) {
          // 가장 긴 매치를 제품명으로 사용 (더 구체적)
          productName = matches.reduce((longest, current) => 
            current.length > longest.length ? current : longest
          );
          break;
        }
      }
      
      // 제품명이 없으면 한글 단어 중 제품 관련 키워드가 있는 것 찾기
      if (!productName) {
        const koreanWords = extractedText.match(/[가-힣]{2,10}/g);
        if (koreanWords) {
          const productMatch = koreanWords.find(word => 
            /(콜라|사이다|음료|제품|식품|과자|빵|우유|주스|식품|음식)/.test(word)
          );
          if (productMatch) {
            productName = productMatch;
          }
        }
      }

      // 제조사가 없으면 제품명에서 추론 시도
      if (!manufacturer && productName) {
        // 코카콜라 -> Coca-Cola
        if (productName.includes('코카')) {
          manufacturer = 'Coca-Cola';
        } else if (productName.includes('펩시')) {
          manufacturer = 'Pepsi';
        }
      }

      // 제품명이 없으면 제조사에서 추론
      if (!productName && manufacturer) {
        if (manufacturer.toLowerCase().includes('coca')) {
          productName = '코카콜라';
        } else if (manufacturer.toLowerCase().includes('pepsi')) {
          productName = '펩시콜라';
        }
      }

      // ===== 검색에 사용할 텍스트 구성 =====
      // 제조사, 제품명, 사이즈만 공백으로 조합하여 검색 쿼리 생성
      // 예: "Coca-Cola 코카콜라 350 ml"
      // 주의: "제품명:", "제조사:", "사이즈 또는 규격:" 같은 라벨은 포함하지 않음
      const searchParts = [];
      if (manufacturer) searchParts.push(manufacturer);
      if (productName) searchParts.push(productName);
      if (size) searchParts.push(size);
      
      // 검색 텍스트가 없으면 전체 텍스트 사용 (하지만 불필요한 정보 제거)
      let searchText = searchParts.join(' ').trim();
      if (!searchText) {
        // 전체 텍스트에서 불필요한 정보 제거
        searchText = extractedText
          .replace(/\b(ORIGINAL|TASTE|Canned|packaged|goods|Drink|Tin|can|kal|kcal)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // 텍스트가 여전히 없고 객체 라벨이 있으면 객체 라벨 사용
      // 예: "Food" -> "Food"를 검색 쿼리에 포함
      if (!searchText && objectLabels.length > 0) {
        // 중복 제거 및 공백으로 조합
        const uniqueLabels = [...new Set(objectLabels.split(/\s+/))].join(' ');
        searchText = uniqueLabels;
      }

      // 구조화된 정보 반환
      return res.status(200).json({
        success: true,
        extractedText: searchText, // 이 값이 실제 검색 쿼리에 사용됨
        productName: productName || null,
        manufacturer: manufacturer || null,
        size: size || null,
        fullText: extractedText,
        objectLabels: objectLabels.length > 0 ? objectLabels : null,
        formatted: {
          productName: productName || '',
          manufacturer: manufacturer || '',
          size: size || ''
        }
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

