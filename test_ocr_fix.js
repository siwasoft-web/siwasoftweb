// path: test_ocr_fix.js
// lang: javascript

// OCR 수정 사항 테스트 스크립트

const testOcrFix = async () => {
  console.log('=== OCR 수정 사항 테스트 시작 ===');
  
  // 테스트 데이터
  const testData = {
    filename: 'test.pdf',
    tool: 'pdf',
    filePath: '/home/siwasoft/siwasoft/mcp/pdf/test.pdf',
    uploadResult: {}
  };
  
  try {
    // 1. Vercel 환경에서 OCR 요청 테스트
    console.log('1. Vercel 환경 OCR 요청 테스트...');
    
    const response = await fetch('/api/ocrmcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('응답 상태:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ OCR 요청 성공');
      console.log('결과:', {
        success: result.success,
        hasText: !!result.text,
        hasTable: !!result.table,
        message: result.message
      });
    } else {
      const error = await response.text();
      console.log('❌ OCR 요청 실패:', error);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
  
  console.log('=== OCR 수정 사항 테스트 완료 ===');
};

// 브라우저에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.testOcrFix = testOcrFix;
  console.log('테스트 함수가 등록되었습니다. 브라우저 콘솔에서 testOcrFix()를 실행하세요.');
}

module.exports = testOcrFix;
