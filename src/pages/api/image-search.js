// 이미지 검색 API - SerpAPI Google Lens API를 사용하여 이미지로 검색하고 제품명 추출
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, imageUrl } = req.body;

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: 'imageBase64 or imageUrl is required' });
    }

    // SerpAPI 설정
    const serpApiKey = process.env.SERP_API_KEY;
    
    if (!serpApiKey) {
      return res.status(200).json({
        success: false,
        productName: null,
        searchQuery: null,
        searchResults: [],
        message: 'SERP_API_KEY가 설정되지 않았습니다.'
      });
    }

    // 이미지 URL이 필요함 (base64면 공개 호스팅 서비스에 업로드하여 URL 생성)
    let imageSearchUrl = imageUrl;
    
    if (!imageSearchUrl && imageBase64) {
      // base64 이미지를 공개 이미지 호스팅 서비스에 업로드하여 URL 생성
      try {
        // base64에서 data URL prefix 제거
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // 방법 1: ImgBB API 사용 (무료, API 키 필요)
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        
        if (imgbbApiKey) {
          // ImgBB API 사용 (multipart/form-data)
          const formData = new URLSearchParams();
          formData.append('key', imgbbApiKey);
          formData.append('image', base64Data);
          
          const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
          });

          if (imgbbResponse.ok) {
            const imgbbData = await imgbbResponse.json();
            if (imgbbData.success && imgbbData.data && imgbbData.data.url) {
              imageSearchUrl = imgbbData.data.url;
              console.log('🔍 ImgBB에 이미지 업로드 완료, URL:', imageSearchUrl);
            } else {
              throw new Error('ImgBB 업로드 실패: ' + (imgbbData.error?.message || '알 수 없는 오류'));
            }
          } else {
            const errorText = await imgbbResponse.text();
            throw new Error(`ImgBB API 오류: ${imgbbResponse.status} - ${errorText}`);
          }
        } else {
          // 방법 2: 기존 업로드 서버 사용 (외부 접근 가능한 경우)
          try {
            const uploadResponse = await fetch('http://221.139.227.131:8003/upload-base64', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file: base64Data,
                filename: `search_${Date.now()}.jpg`,
                mimetype: 'image/jpeg'
              })
            });

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              imageSearchUrl = `http://221.139.227.131:8003/images/${uploadData.file.savedName}`;
              console.log('🔍 로컬 서버에 이미지 업로드 완료, URL:', imageSearchUrl);
            } else {
              throw new Error('로컬 서버 업로드 실패');
            }
          } catch (uploadError) {
            throw new Error('이미지 호스팅 실패. IMGBB_API_KEY를 환경 변수에 추가하거나, 업로드 서버가 외부에서 접근 가능한지 확인해주세요.');
          }
        }
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        return res.status(200).json({
          success: false,
          productName: null,
          searchQuery: null,
          searchResults: [],
          message: `이미지를 업로드하여 URL을 생성하는데 실패했습니다: ${error.message}`
        });
      }
    }

    if (!imageSearchUrl) {
      return res.status(200).json({
        success: false,
        productName: null,
        searchQuery: null,
        searchResults: [],
        message: '이미지 URL이 필요합니다.'
      });
    }

    console.log('🔍 SerpAPI Google Lens 검색 시작, 이미지 URL:', imageSearchUrl);
    
    // 이미지 URL 접근 가능 여부 확인 (Google Lens가 접근할 수 있어야 함)
    let imageAccessible = false;
    try {
      const imageCheckResponse = await fetch(imageSearchUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (imageCheckResponse.ok) {
        imageAccessible = true;
        console.log('✅ 이미지 URL 접근 가능 확인됨 (Content-Type:', imageCheckResponse.headers.get('content-type'), ')');
      } else {
        console.warn('⚠️ 이미지 URL 접근 확인 실패:', imageCheckResponse.status);
      }
    } catch (error) {
      console.warn('⚠️ 이미지 URL 접근 확인 중 오류:', error.message);
    }

    // SerpAPI Google Lens API 호출 (재시도 로직 포함)
    // 크롬과 동일하게 동작하도록 필요한 파라미터 모두 포함
    let searchData = null;
    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 SerpAPI 재시도 ${attempt}/${maxRetries}...`);
          // 재시도 전 대기 (Google Lens 처리 시간 고려)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
        
        const searchUrl = `https://serpapi.com/search?engine=google_lens&api_key=${serpApiKey}&url=${encodeURIComponent(imageSearchUrl)}&hl=ko&gl=kr`;
        
        if (attempt === 0) {
          console.log('🔍 SerpAPI 호출 URL (API 키 제외):', searchUrl.replace(serpApiKey, '***'));
        }
        
        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
        });
        
        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`❌ SerpAPI HTTP 오류 (시도 ${attempt + 1}):`, searchResponse.status, errorText);
          lastError = new Error(`SerpAPI error: ${searchResponse.status} - ${errorText}`);
          continue;
        }

        searchData = await searchResponse.json();
        
        // 에러 응답 확인
        if (searchData.error) {
          console.error(`❌ SerpAPI 응답 오류 (시도 ${attempt + 1}):`, searchData.error);
          
          // "hasn't returned any results" 오류는 재시도 가능
          if (searchData.error.includes("hasn't returned any results") && attempt < maxRetries) {
            lastError = new Error(searchData.error);
            continue;
          }
          
          // 다른 오류나 재시도 횟수 초과
          return res.status(200).json({
            success: false,
            productName: null,
            searchQuery: imageSearchUrl,
            searchResults: [],
            message: `SerpAPI 오류: ${searchData.error}`,
            imageAccessible: imageAccessible
          });
        }
        
        // 성공적으로 결과를 받았으면 루프 종료
        break;
        
      } catch (error) {
        console.error(`❌ SerpAPI 호출 오류 (시도 ${attempt + 1}):`, error.message);
        lastError = error;
        if (attempt < maxRetries) {
          continue;
        }
        throw error;
      }
    }
    
    // 모든 재시도 실패
    if (!searchData) {
      return res.status(200).json({
        success: false,
        productName: null,
        searchQuery: imageSearchUrl,
        searchResults: [],
        message: `SerpAPI 호출 실패: ${lastError?.message || '알 수 없는 오류'}`,
        imageAccessible: imageAccessible
      });
    }
    
    // 상세 디버깅 로그 - 전체 응답 구조 확인
    console.log('🔍 SerpAPI Google Lens 전체 응답 키:', Object.keys(searchData));
    console.log('🔍 SerpAPI Google Lens 결과 요약:', {
      visual_matches: searchData.visual_matches?.length || 0,
      knowledge_graph: searchData.knowledge_graph ? '있음' : '없음',
      inline_images: searchData.inline_images?.length || 0,
      related_searches: searchData.related_searches?.length || 0,
      exact_matches: searchData.exact_matches?.length || 0,
      reverse_image_search: searchData.reverse_image_search ? '있음' : '없음',
      error: searchData.error || '없음'
    });
    
    // 전체 응답 구조 일부 출력 (너무 길면 잘림)
    const responsePreview = JSON.stringify(searchData, null, 2);
    if (responsePreview.length > 3000) {
      console.log('🔍 SerpAPI 응답 구조 (처음 3000자):', responsePreview.substring(0, 3000));
      console.log('🔍 SerpAPI 응답 구조 (마지막 500자):', responsePreview.substring(responsePreview.length - 500));
    } else {
      console.log('🔍 SerpAPI 응답 구조:', responsePreview);
    }

    // 검색 결과에서 제품명 추출
    const productName = extractProductNameFromSerpAPIResults(searchData);

    // 검색 결과 수집 (visual_matches, exact_matches, inline_images 등)
    const allSearchResults = [
      ...(searchData.exact_matches || []),
      ...(searchData.visual_matches || []),
      ...(searchData.inline_images || [])
    ].slice(0, 10);

    return res.status(200).json({
      success: true,
      productName: productName,
      searchQuery: imageSearchUrl,
      searchResults: allSearchResults,
      rawData: {
        hasKnowledgeGraph: !!searchData.knowledge_graph,
        visualMatchesCount: searchData.visual_matches?.length || 0,
        exactMatchesCount: searchData.exact_matches?.length || 0,
        inlineImagesCount: searchData.inline_images?.length || 0
      },
      message: productName ? `제품명: ${productName}` : '제품명을 찾을 수 없습니다.'
    });

  } catch (error) {
    console.error('Image search error:', error);
    return res.status(500).json({
      error: 'Failed to search image',
      details: error.message
    });
  }
}

// SerpAPI 검색 결과에서 제품명 추출 (크롬 이미지 검색과 동일한 방식)
function extractProductNameFromSerpAPIResults(searchData) {
  console.log('🔍 제품명 추출 시작, 응답 키:', Object.keys(searchData));
  
  // 1. Knowledge Graph에서 제품명 추출 (가장 신뢰도 높음)
  if (searchData.knowledge_graph) {
    console.log('🔍 Knowledge Graph 데이터:', JSON.stringify(searchData.knowledge_graph, null, 2));
    const kg = searchData.knowledge_graph;
    
    // title이 있으면 우선 사용
    if (kg.title) {
      console.log('✅ Knowledge Graph title에서 제품명 추출:', kg.title);
      return kg.title;
    }
    
    // subtitle도 확인
    if (kg.subtitle) {
      console.log('✅ Knowledge Graph subtitle에서 제품명 추출:', kg.subtitle);
      return kg.subtitle;
    }
  }

  // 2. Exact Matches에서 제품명 추출 (정확히 일치하는 이미지)
  if (searchData.exact_matches && Array.isArray(searchData.exact_matches) && searchData.exact_matches.length > 0) {
    console.log('🔍 Exact Matches 개수:', searchData.exact_matches.length);
    for (const match of searchData.exact_matches.slice(0, 5)) {
      if (match.title) {
        console.log('✅ Exact Match에서 제품명 추출:', match.title);
        return match.title;
      }
    }
  }

  // 3. Visual Matches에서 제품명 추출 (시각적으로 유사한 이미지)
  if (searchData.visual_matches && Array.isArray(searchData.visual_matches) && searchData.visual_matches.length > 0) {
    console.log('🔍 Visual Matches 개수:', searchData.visual_matches.length);
    console.log('🔍 첫 번째 Visual Match:', JSON.stringify(searchData.visual_matches[0], null, 2));
    
    // 한글이 포함된 title 우선 찾기
    for (const match of searchData.visual_matches.slice(0, 10)) {
      if (match.title) {
        // 한글이 포함되어 있으면 우선 사용
        if (/[가-힣]/.test(match.title)) {
          console.log('✅ Visual Match에서 한글 제품명 추출:', match.title);
          return match.title;
        }
      }
    }
    
    // 한글이 없어도 첫 번째 title 사용
    const firstMatch = searchData.visual_matches[0];
    if (firstMatch.title) {
      console.log('✅ Visual Match에서 제품명 추출 (영문):', firstMatch.title);
      return firstMatch.title;
    }
    
    // link에서 제품명 추출 시도
    if (firstMatch.link) {
      const linkMatch = firstMatch.link.match(/([^\/]+)$/);
      if (linkMatch && linkMatch[1]) {
        const decodedLink = decodeURIComponent(linkMatch[1]);
        if (/[가-힣]/.test(decodedLink)) {
          console.log('✅ Visual Match link에서 제품명 추출:', decodedLink);
          return decodedLink;
        }
      }
    }
  }

  // 4. Reverse Image Search 결과에서 제품명 추출
  if (searchData.reverse_image_search) {
    const ris = searchData.reverse_image_search;
    console.log('🔍 Reverse Image Search 데이터:', JSON.stringify(ris, null, 2));
    
    if (ris.title) {
      console.log('✅ Reverse Image Search title에서 제품명 추출:', ris.title);
      return ris.title;
    }
  }

  // 5. Inline Images에서 제품명 추출 시도
  if (searchData.inline_images && Array.isArray(searchData.inline_images) && searchData.inline_images.length > 0) {
    console.log('🔍 Inline Images 개수:', searchData.inline_images.length);
    for (const image of searchData.inline_images.slice(0, 5)) {
      if (image.title) {
        if (/[가-힣]/.test(image.title)) {
          console.log('✅ Inline Image에서 한글 제품명 추출:', image.title);
          return image.title;
        }
      }
    }
    
    // 한글이 없어도 첫 번째 title 사용
    if (searchData.inline_images[0]?.title) {
      console.log('✅ Inline Image에서 제품명 추출:', searchData.inline_images[0].title);
      return searchData.inline_images[0].title;
    }
  }

  // 6. Related Searches에서 제품명 추출 시도
  if (searchData.related_searches && Array.isArray(searchData.related_searches) && searchData.related_searches.length > 0) {
    console.log('🔍 Related Searches 개수:', searchData.related_searches.length);
    for (const search of searchData.related_searches.slice(0, 5)) {
      if (search.query) {
        if (/[가-힣]/.test(search.query)) {
          console.log('✅ Related Search에서 한글 제품명 추출:', search.query);
          return search.query;
        }
      }
    }
  }

  // 7. Organic Results에서 제품명 추출 시도
  if (searchData.organic_results && Array.isArray(searchData.organic_results) && searchData.organic_results.length > 0) {
    console.log('🔍 Organic Results 개수:', searchData.organic_results.length);
    for (const result of searchData.organic_results.slice(0, 5)) {
      if (result.title && /[가-힣]/.test(result.title)) {
        console.log('✅ Organic Result에서 제품명 추출:', result.title);
        return result.title;
      }
    }
  }

  console.log('❌ 제품명을 찾을 수 없음 - 모든 소스 확인 완료');
  return null;
}
