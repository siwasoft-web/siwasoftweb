import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, tool } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const pdfPath = path.join('/home/siwasoft/siwasoft/mcp/pdf', filename);

    // PDF 파일 존재 확인
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // FastAPI 서버 (포트 8001)에 요청 보내기
    const fastApiResponse = await fetch('http://localhost:8001/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!fastApiResponse.ok) {
      throw new Error(`FastAPI 서버 오류: ${fastApiResponse.status}`);
    }

    const fastApiResult = await fastApiResponse.json();

    if (tool === 'embed') {
      // 임베딩 모드
      return res.status(200).json({
        success: true,
        message: 'PDF가 임베딩되었습니다',
        text: 'PDF가 성공적으로 임베딩되어 검색 가능한 상태가 되었습니다.',
        table: '',
        fastApiResult: fastApiResult
      });
    } else {
      // OCR 모드: 처리된 결과 파일들 읽기
      const result = readProcessedResults('/home/siwasoft/siwasoft/mcp/out');
      return res.status(200).json({
        success: true,
        text: result.text,
        table: result.table,
        fastApiResult: fastApiResult
      });
    }

  } catch (error) {
    console.error('OCR 실행 오류:', error);
    res.status(500).json({ error: 'OCR 실행 실패' });
  }
}


function readProcessedResults(outputDir) {
  try {
    // 출력 디렉토리에서 마크다운 파일들 찾기
    const files = fs.readdirSync(outputDir, { recursive: true });
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    let textContent = '';
    let tableContent = '';

    mdFiles.forEach(file => {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 테이블과 일반 텍스트 분리
      const lines = content.split('\n');
      let inTable = false;
      let currentTable = '';
      let currentText = '';

      for (const line of lines) {
        if (line.trim().startsWith('|') && line.includes('|')) {
          // 테이블 라인
          inTable = true;
          currentTable += line + '\n';
        } else if (inTable && line.trim() === '') {
          // 테이블 끝
          inTable = false;
          if (currentTable.trim()) {
            tableContent += `\n=== ${file} ===\n${currentTable}\n`;
            currentTable = '';
          }
        } else if (!inTable) {
          // 일반 텍스트
          currentText += line + '\n';
        }
      }

      if (currentText.trim()) {
        textContent += `\n=== ${file} ===\n${currentText}\n`;
      }
    });

    return {
      text: textContent.trim() || '텍스트 추출 결과가 없습니다.',
      table: tableContent.trim() || '테이블 추출 결과가 없습니다.'
    };

  } catch (error) {
    console.error('결과 읽기 오류:', error);
    return {
      text: '결과를 읽는 중 오류가 발생했습니다.',
      table: ''
    };
  }
}
