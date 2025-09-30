import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, tool, target_dir, out_dir, recursive } = req.body;
    
    // 디버깅을 위한 로깅
    console.log('OCR MCP 요청:', { filename, tool, target_dir, out_dir, recursive });

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!tool || !['pdf', 'embed', 'ocr', 'img'].includes(tool)) {
      return res.status(400).json({ error: 'Tool must be one of: "pdf", "embed", "ocr", "img"' });
    }

    // 파일 경로 설정 (툴에 따라 다름)
    let filePath, apiEndpoint, defaultTargetDir;
    
    if (tool === 'img') {
      defaultTargetDir = '/home/siwasoft/siwasoft/mcp/img';
      filePath = path.join(target_dir || defaultTargetDir, filename);
      apiEndpoint = 'http://localhost:8001/img';
    } else {
      defaultTargetDir = '/home/siwasoft/siwasoft/mcp/pdf';
      filePath = path.join(target_dir || defaultTargetDir, filename);
      apiEndpoint = 'http://localhost:8001/pdf';
    }

    // 파일 존재 확인
    console.log('파일 경로 확인:', filePath);
    console.log('파일 존재 여부:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      console.log('파일을 찾을 수 없음:', filePath);
      return res.status(404).json({ error: `${tool.toUpperCase()} file not found: ${filePath}` });
    }

    // FastAPI 서버 (포트 8001)에 요청 보내기
    const fastApiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_dir: target_dir || defaultTargetDir,
        out_dir: out_dir || '/home/siwasoft/siwasoft/mcp/out',
        recursive: recursive || false
      })
    });

    if (!fastApiResponse.ok) {
      throw new Error(`FastAPI 서버 오류: ${fastApiResponse.status}`);
    }

    const fastApiResult = await fastApiResponse.json();

    // 툴에 따른 응답 처리
    switch (tool) {
      case 'pdf':
        // PDF 파싱만 수행
        return res.status(200).json({
          success: true,
          message: 'PDF 파싱이 완료되었습니다',
          text: 'PDF가 성공적으로 파싱되어 마크다운으로 변환되었습니다.',
          table: '',
          fastApiResult: fastApiResult
        });

      case 'embed':
        // 임베딩 모드
        return res.status(200).json({
          success: true,
          message: 'PDF가 임베딩되었습니다',
          text: 'PDF가 성공적으로 임베딩되어 검색 가능한 상태가 되었습니다.',
          table: '',
          fastApiResult: fastApiResult
        });

      case 'ocr':
        // OCR 모드: 처리된 결과 파일들 읽기
        const result = readProcessedResults(out_dir || '/home/siwasoft/siwasoft/mcp/out');
        return res.status(200).json({
          success: true,
          message: 'OCR 처리가 완료되었습니다',
          text: result.text,
          table: result.table,
          fastApiResult: fastApiResult
        });

      case 'img':
        // IMG 모드: 이미지 OCR 처리된 결과 파일들 읽기
        const imgResult = readImageProcessedResults(out_dir || '/home/siwasoft/siwasoft/mcp/out');
        return res.status(200).json({
          success: true,
          message: '이미지 OCR 처리가 완료되었습니다',
          text: imgResult.text,
          table: imgResult.table,
          fastApiResult: fastApiResult
        });

      default:
        return res.status(400).json({ error: 'Invalid tool specified' });
    }

  } catch (error) {
    console.error('OCR MCP 실행 오류:', error);
    return res.status(500).json({ 
      error: 'OCR MCP 실행 실패',
      details: error.message 
    });
  }
}

function readProcessedResults(outputDir) {
  try {
    let textContent = '';
    let tableContent = '';

    // PDF 폴더들을 찾기
    const pdfDirs = fs.readdirSync(outputDir).filter(item => {
      const itemPath = path.join(outputDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    pdfDirs.forEach(pdfDir => {
      const pdfPath = path.join(outputDir, pdfDir);
      
      // page_XXXX 폴더들을 찾기
      const pageDirs = fs.readdirSync(pdfPath).filter(item => {
        const itemPath = path.join(pdfPath, item);
        return fs.statSync(itemPath).isDirectory() && item.startsWith('page_');
      });

      pageDirs.forEach(pageDir => {
        const pagePath = path.join(pdfPath, pageDir);
        
        // 1. 원본 마크다운 파일 (page_XXXX.md) 읽기 - 텍스트 추출 결과로 사용
        const originalMdFile = path.join(pagePath, `${pageDir}.md`);
        if (fs.existsSync(originalMdFile)) {
          const originalContent = fs.readFileSync(originalMdFile, 'utf-8');
          textContent += `\n=== ${pdfDir}/${pageDir} (원본) ===\n${originalContent}\n`;
        }

        // 2. AI 처리된 테이블 파일 (page_XXXX.tables.proc.md) 읽기 - 테이블 추출 결과로 사용
        const procTableFile = path.join(pagePath, `${pageDir}.tables.proc.md`);
        if (fs.existsSync(procTableFile)) {
          const procTableContent = fs.readFileSync(procTableFile, 'utf-8');
          tableContent += `\n=== ${pdfDir}/${pageDir} (AI 처리된 테이블) ===\n${procTableContent}\n`;
        }
      });
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

function readImageProcessedResults(outputDir) {
  try {
    let textContent = '';
    let tableContent = '';

    // 이미지 폴더들을 찾기
    const imgDirs = fs.readdirSync(outputDir).filter(item => {
      const itemPath = path.join(outputDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    imgDirs.forEach(imgDir => {
      const imgPath = path.join(outputDir, imgDir);
      
      // img_XXXX.md 파일들을 찾기
      const files = fs.readdirSync(imgPath).filter(file => {
        return file.endsWith('.md') && file.startsWith('img_');
      });

      files.forEach(file => {
        const filePath = path.join(imgPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        textContent += `\n=== ${imgDir}/${file} ===\n${content}\n`;
      });
    });

    return {
      text: textContent.trim() || '이미지에서 텍스트를 추출하지 못했습니다.',
      table: '이미지 OCR에서는 테이블 추출을 지원하지 않습니다.'
    };

  } catch (error) {
    console.error('이미지 결과 읽기 오류:', error);
    return {
      text: '이미지 결과를 읽는 중 오류가 발생했습니다.',
      table: ''
    };
  }
}
