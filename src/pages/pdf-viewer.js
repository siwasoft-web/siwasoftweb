import { useRouter } from 'next/router';
import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

export default function PDFViewer() {
  const router = useRouter();
  const { pdf_name, page } = router.query;
  const containerRef = useRef(null);

  const loadPDF = useCallback(() => {
    // router.query에서 최신 값 가져오기
    const currentPdfName = router.query.pdf_name;
    const currentPage = router.query.page;
    
    if (!currentPdfName || !containerRef.current || !window.pdfjsLib) return;

    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // 페이지 번호를 URL에 포함 (페이지별 PDF 파일을 가져오기 위해)
    const pageNumber = currentPage ? parseInt(currentPage, 10) : 1;
    // IP 주소를 사용하여 PDF API 호출
    const apiBase = process.env.NEXT_PUBLIC_PDF_VIEWER_BASE || 'http://221.139.227.131:3000';
    const pdfUrl = `${apiBase}/api/pdf-viewer?pdf_name=${encodeURIComponent(currentPdfName)}${pageNumber ? `&page=${pageNumber}` : ''}`;
    
    console.log('📄 PDF 로드 시작:', { pdf_name: currentPdfName, pageNumber, pdfUrl });

    pdfjsLib.getDocument({
      url: pdfUrl,
      httpHeaders: {},
      withCredentials: false
    }).promise.then((pdf) => {
      console.log('✅ PDF 문서 로드 성공, 총 페이지:', pdf.numPages);
      
      // 페이지별 PDF 파일은 단일 페이지만 포함하므로 항상 첫 페이지 렌더링
      // (API가 이미 해당 페이지의 PDF 파일을 반환했으므로)
      const renderPageNumber = 1;
      console.log('📄 렌더링할 페이지:', renderPageNumber, '(페이지별 PDF 파일이므로 항상 1페이지)');
      
      // 첫 페이지 렌더링
      pdf.getPage(renderPageNumber).then((pageObj) => {
        const viewport = pageObj.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          pageObj.render(renderContext).promise.then(() => {
            console.log('✅ PDF 페이지 렌더링 완료');
          }).catch((renderError) => {
            console.error('❌ PDF 페이지 렌더링 오류:', renderError);
            if (containerRef.current) {
              containerRef.current.innerHTML = '<p class="text-red-500">PDF 렌더링 중 오류가 발생했습니다.</p>';
            }
          });
        }
      }).catch((pageError) => {
        console.error('❌ PDF 페이지 가져오기 오류:', pageError);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p class="text-red-500">PDF 페이지를 가져올 수 없습니다.</p>';
        }
      });
    }).catch((error) => {
      console.error('❌ PDF 로드 오류:', error);
      console.error('❌ 오류 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (containerRef.current) {
        let errorMessage = 'PDF를 로드할 수 없습니다.';
        if (error.message) {
          errorMessage += `<br><small class="text-gray-500">${error.message}</small>`;
        }
        containerRef.current.innerHTML = `<p class="text-red-500">${errorMessage}</p>`;
      }
    });
  }, [router.query]);

  useEffect(() => {
    if (!pdf_name || !containerRef.current) return;

    // PDF.js 로드 대기
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      // 페이지가 변경되면 다시 로드
      loadPDF();
    }
  }, [pdf_name, page, loadPDF]);

  if (!pdf_name) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">PDF 파일명이 필요합니다.</p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          // PDF.js 로드 후 다시 시도
          setTimeout(() => {
            if (window.pdfjsLib && containerRef.current) {
              loadPDF();
            }
          }, 100);
        }}
      />
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">
              {pdf_name} {page && `(페이지 ${page})`}
            </h1>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              닫기
            </button>
          </div>
          <div ref={containerRef} className="flex justify-center">
            <p className="text-gray-500">PDF를 로드하는 중...</p>
          </div>
        </div>
      </div>
    </>
  );
}

