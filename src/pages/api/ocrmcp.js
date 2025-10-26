import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, tool, target_dir, out_dir, recursive, base64Data, isVercel } = req.body;
    
    // 디버깅을 위한 로깅
    console.log('OCR MCP 요청:', { filename, tool, target_dir, out_dir, recursive, isVercel });

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!tool || !['pdf', 'img'].includes(tool)) {
      return res.status(400).json({ error: 'Tool must be one of: "pdf", "img"' });
    }

    // 환경 변수에서 API 베이스 URL 가져오기 (fallback으로 IP 사용)
    const baseUrl = process.env.OCR_API_BASE || 'http://221.139.227.131:8001';
    
    let apiEndpoint, requestBody;

    if (isVercel) {
      // Vercel 환경: 기존 방식과 동일하게 파일 경로 기반으로 처리
      console.log('Vercel 환경: 파일 경로 기반 OCR 처리');
      let defaultTargetDir;
      
      if (tool === 'img') {
        defaultTargetDir = '/home/siwasoft/siwasoft/mcp/img';
        apiEndpoint = `${baseUrl}/img`;
      } else {
        defaultTargetDir = '/home/siwasoft/siwasoft/mcp/pdf';
        apiEndpoint = `${baseUrl}/pdf`;
      }

      requestBody = {
        target_dir: defaultTargetDir,
        out_dir: out_dir || '/home/siwasoft/siwasoft/mcp/out',
        recursive: recursive || false
      };
    } else {
      // 로컬 환경: 기존 방식 (파일 경로 기반)
      let filePath, defaultTargetDir;
      
      if (tool === 'img') {
        defaultTargetDir = '/home/siwasoft/siwasoft/mcp/img';
        filePath = path.join(target_dir || defaultTargetDir, filename);
        apiEndpoint = `${baseUrl}/img`;
      } else {
        defaultTargetDir = '/home/siwasoft/siwasoft/mcp/pdf';
        filePath = path.join(target_dir || defaultTargetDir, filename);
        apiEndpoint = `${baseUrl}/pdf`;
      }

      // 파일 존재 확인
      console.log('파일 경로 확인:', filePath);
      console.log('파일 존재 여부:', fs.existsSync(filePath));
      
      if (!fs.existsSync(filePath)) {
        console.log('파일을 찾을 수 없음:', filePath);
        return res.status(404).json({ error: `${tool.toUpperCase()} file not found: ${filePath}` });
      }

      requestBody = {
        target_dir: target_dir || defaultTargetDir,
        out_dir: out_dir || '/home/siwasoft/siwasoft/mcp/out',
        recursive: recursive || false
      };
    }

    // FastAPI 서버에 요청 보내기
    console.log('API 엔드포인트:', apiEndpoint);
    console.log('요청 바디:', requestBody);

    const fastApiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!fastApiResponse.ok) {
      const errorText = await fastApiResponse.text();
      console.error('FastAPI 오류 응답:', errorText);
      throw new Error(`Backend API error: ${fastApiResponse.status} - ${errorText}`);
    }

    const fastApiResult = await fastApiResponse.json();

    // Vercel 환경에서는 FastAPI 결과를 직접 반환 (파일 시스템 접근 불가)
    if (isVercel) {
      return res.status(200).json({
        success: true,
        message: `${tool.toUpperCase()} 처리가 완료되었습니다`,
        text: fastApiResult.text || '텍스트 추출 결과가 없습니다.',
        table: fastApiResult.table || '테이블 추출 결과가 없습니다.',
        fastApiResult: fastApiResult
      });
    }

    // 로컬 환경: 기존 방식대로 파일 시스템에서 결과 읽기

    // 툴에 따른 응답 처리
    switch (tool) {
      case 'pdf':
        // PDF 파싱: 텍스트와 테이블 추출
        const pdfResult = readProcessedResults('/home/siwasoft/siwasoft/mcp/end', filename);
        return res.status(200).json({
          success: true,
          message: 'PDF 파싱이 완료되었습니다',
          text: pdfResult.text,
          table: pdfResult.table,
          fastApiResult: fastApiResult
        });

      case 'img':
        // IMG 모드: 이미지 OCR 처리된 결과 파일들 읽기
        const imgResult = readImageProcessedResults('/home/siwasoft/siwasoft/mcp/end', filename);
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

function readProcessedResults(outputDir, targetFilename) {
  try {
    let textContent = '';
    let tableContent = '';

    // 파일명에서 확장자 제거하여 폴더명과 매칭
    const folderName = targetFilename ? path.parse(targetFilename).name : null;
    
    // PDF 폴더들을 찾기
    const pdfDirs = fs.readdirSync(outputDir).filter(item => {
      const itemPath = path.join(outputDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    // 특정 파일명이 지정된 경우 해당 폴더만 처리
    const targetDirs = folderName ? pdfDirs.filter(dir => dir.includes(folderName)) : pdfDirs;

    targetDirs.forEach(pdfDir => {
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

function readImageProcessedResults(outputDir, targetFilename) {
  try {
    let textContent = '';
    let tableContent = '';

    // 파일명에서 확장자 제거하여 폴더명과 매칭
    const folderName = targetFilename ? path.parse(targetFilename).name : null;
    
    // 이미지 폴더들을 찾기
    const imgDirs = fs.readdirSync(outputDir).filter(item => {
      const itemPath = path.join(outputDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    // 특정 파일명이 지정된 경우 해당 폴더만 처리
    const targetDirs = folderName ? imgDirs.filter(dir => dir.includes(folderName)) : imgDirs;

    targetDirs.forEach(imgDir => {
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
