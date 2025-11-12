import fs from 'fs';
import path from 'path';

// Next.js API route config - 바이너리 응답 허용
export const config = {
  api: {
    bodyParser: false, // 바이너리 데이터 전송을 위해 bodyParser 비활성화
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdf_name, page } = req.query;
    
    console.log('📄 PDF 뷰어 요청:', { pdf_name, page });
    
    if (!pdf_name) {
      return res.status(400).json({ error: 'pdf_name is required' });
    }

    // URL 디코딩
    const decodedPdfName = decodeURIComponent(pdf_name);
    console.log('📄 디코딩된 PDF 이름:', decodedPdfName);

    let pdfPath = null;
    const pageNum = page ? parseInt(page, 10) : null;

    // 1. 페이지 번호가 있으면 페이지별 PDF 파일 찾기 (우선순위)
    if (pageNum) {
      const pagesDir = path.join('/home/siwasoft/siwasoft/mcp/end', decodedPdfName, 'pages');
      console.log('🔍 페이지별 PDF 찾기:', pagesDir);
      
      try {
        if (fs.existsSync(pagesDir)) {
          const pagesDirStats = fs.statSync(pagesDir);
          if (pagesDirStats.isDirectory()) {
            // page_0002.pdf 형식으로 찾기
            const pageFileName = `page_${String(pageNum).padStart(4, '0')}.pdf`;
            const pageFilePath = path.join(pagesDir, pageFileName);
            console.log('🔍 페이지 파일 경로:', pageFilePath);
            
            if (fs.existsSync(pageFilePath)) {
              const pageFileStats = fs.statSync(pageFilePath);
              if (pageFileStats.isFile()) {
                pdfPath = pageFilePath;
                console.log('✅ 페이지별 PDF 파일 찾음:', pdfPath);
              } else {
                console.log('❌ 페이지 파일이 디렉터리임:', pageFilePath);
              }
            } else {
              console.log('❌ 페이지별 PDF 파일 없음:', pageFilePath);
            }
          } else {
            console.log('❌ pages 경로가 디렉터리가 아님:', pagesDir);
          }
        } else {
          console.log('❌ pages 디렉터리 없음:', pagesDir);
        }
      } catch (err) {
        console.error('❌ 페이지별 PDF 찾기 오류:', err.message);
        console.error('❌ 오류 스택:', err.stack);
      }
    }

    // 2. 원본 PDF 파일 찾기
    if (!pdfPath) {
      console.log('🔍 원본 PDF 파일 찾기 시작');
      
      const basePaths = [
        path.join('/home/siwasoft/siwasoft/mcp/end', decodedPdfName),
        path.join('/home/siwasoft/siwasoft/mcp/pdf', `${decodedPdfName}.pdf`),
        path.join('/home/siwasoft/siwasoft/mcp/pdf', decodedPdfName),
      ];

      // end/<pdf_name> 폴더 내에서 PDF 파일 찾기
      const endDir = path.join('/home/siwasoft/siwasoft/mcp/end', decodedPdfName);
      console.log('🔍 end 디렉터리 확인:', endDir);
      
      try {
        if (fs.existsSync(endDir)) {
          const endDirStats = fs.statSync(endDir);
          if (endDirStats.isDirectory()) {
            const files = fs.readdirSync(endDir);
            console.log('📁 end 디렉터리 파일 목록:', files);
            
            for (const file of files) {
              if (file.toLowerCase().endsWith('.pdf') && file !== 'pages') {
                const candidatePath = path.join(endDir, file);
                if (fs.existsSync(candidatePath)) {
                  const candidateStats = fs.statSync(candidatePath);
                  if (candidateStats.isFile()) {
                    pdfPath = candidatePath;
                    console.log('✅ 원본 PDF 파일 찾음:', pdfPath);
                    break;
                  }
                }
              }
            }
          } else {
            console.log('❌ end 경로가 디렉터리가 아님:', endDir);
          }
        } else {
          console.log('❌ end 디렉터리 없음:', endDir);
        }
      } catch (err) {
        console.error('❌ end 디렉터리 확인 오류:', err.message);
        console.error('❌ 오류 스택:', err.stack);
      }

      // 직접 경로 확인
      if (!pdfPath) {
        for (const candidate of basePaths) {
          console.log('🔍 경로 후보 확인:', candidate);
          try {
            if (fs.existsSync(candidate)) {
              const stats = fs.statSync(candidate);
              if (stats.isFile() && candidate.toLowerCase().endsWith('.pdf')) {
                pdfPath = candidate;
                console.log('✅ 직접 경로로 PDF 파일 찾음:', pdfPath);
                break;
              } else if (stats.isDirectory()) {
                const files = fs.readdirSync(candidate);
                for (const file of files) {
                  if (file.toLowerCase().endsWith('.pdf')) {
                    const fullPath = path.join(candidate, file);
                    if (fs.existsSync(fullPath)) {
                      const fullPathStats = fs.statSync(fullPath);
                      if (fullPathStats.isFile()) {
                        pdfPath = fullPath;
                        console.log('✅ 디렉터리 내 PDF 파일 찾음:', pdfPath);
                        break;
                      }
                    }
                  }
                }
                if (pdfPath) break;
              }
            }
          } catch (err) {
            console.error('❌ 경로 후보 확인 오류:', candidate, err.message);
            console.error('❌ 오류 스택:', err.stack);
          }
        }
      }
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      console.error('❌ PDF 파일을 찾을 수 없음:', { decodedPdfName, pageNum, pdfPath });
      return res.status(404).json({ 
        error: 'PDF file not found',
        searched_paths: {
          pdf_name: decodedPdfName,
          page: pageNum,
          pages_dir: pageNum ? path.join('/home/siwasoft/siwasoft/mcp/end', decodedPdfName, 'pages') : null
        }
      });
    }

    console.log('📖 PDF 파일 읽기 시작:', pdfPath);

    // PDF 파일 읽기
    let pdfBuffer;
    try {
      pdfBuffer = fs.readFileSync(pdfPath);
      console.log('✅ PDF 파일 읽기 성공, 크기:', pdfBuffer.length, 'bytes');
    } catch (readError) {
      console.error('❌ PDF 파일 읽기 오류:', readError.message);
      return res.status(500).json({ 
        error: 'Failed to read PDF file',
        details: readError.message,
        path: pdfPath
      });
    }
    
    console.log('✅ PDF 파일 전송 시작, 크기:', pdfBuffer.length);
    
    // Buffer를 직접 전송 (Next.js Pages Router)
    try {
      // res.writeHead()와 res.end()를 사용하여 바이너리 데이터 전송
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(path.basename(pdfPath))}"`,
        'Content-Length': pdfBuffer.length,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(pdfBuffer);
      return;
    } catch (sendError) {
      console.error('❌ PDF 파일 전송 오류:', sendError.message);
      console.error('❌ 전송 오류 스택:', sendError.stack);
      throw sendError;
    }

  } catch (error) {
    console.error('❌ PDF viewer API 오류:', error);
    console.error('❌ 스택 트레이스:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to serve PDF file',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

