// path: src/app/aiocr/page.js
// lang: javascript

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { UploadCloud, FileText, X, Loader2, Wand2, FileUp, Bot, Search, Image, Download, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function AiOcrPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedTable, setExtractedTable] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('pdf'); // 'pdf' or 'img'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 작업 이력 관리 상태
  const [ocrHistory, setOcrHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpenHistory, setIsDropdownOpenHistory] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (isDropdownOpenHistory && !event.target.closest('.dropdown-container-history')) {
        setIsDropdownOpenHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isDropdownOpenHistory]);

  // OCR 작업 이력 가져오기
  const fetchOcrHistory = async () => {
    try {
      const response = await fetch('/api/ocr-history');
      const data = await response.json();
      
      if (data.success) {
        setOcrHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching OCR history:', error);
    }
  };

  // OCR 작업 결과 저장
  const saveOcrResult = async (filename, tool, extractedText, extractedTable) => {
    try {
      const response = await fetch('/api/ocr-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          tool: tool,
          extractedText: extractedText,
          extractedTable: extractedTable,
          originalFilename: file?.name
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setCurrentSessionId(data.sessionId);
        fetchOcrHistory();
        return data.sessionId;
      }
    } catch (error) {
      console.error('Error saving OCR result:', error);
    }
    return null;
  };

  // OCR 작업 결과 삭제
  const deleteOcrResult = async (sessionId) => {
    try {
      const response = await fetch(`/api/ocr-history?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchOcrHistory();
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setExtractedText('');
          setExtractedTable('');
        }
      }
    } catch (error) {
      console.error('Error deleting OCR result:', error);
    }
  };

  // 작업 선택
  const selectWork = (work) => {
    setCurrentSessionId(work._id);
    setExtractedText(work.extractedText);
    setExtractedTable(work.extractedTable);
    setSelectedTool(work.tool);
  };

  // 새 작업 시작
  const startNewWork = () => {
    setCurrentSessionId(null);
    setExtractedText('');
    setExtractedTable('');
    setFile(null);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 컴포넌트 마운트 시 초기화 및 이력 가져오기
  useEffect(() => {
    // 페이지 로드 시 항상 초기 상태로 리셋
    setCurrentSessionId(null);
    setExtractedText('');
    setExtractedTable('');
    setFile(null);
    
    if (session) {
      fetchOcrHistory();
    }
  }, [session]);

  // URL 파라미터에서 작업 ID 처리 (홈페이지에서 링크로 온 경우만)
  useEffect(() => {
    const workId = searchParams.get('work');
    if (workId && ocrHistory.length > 0) {
      const work = ocrHistory.find(w => w._id === workId);
      if (work) {
        selectWork(work);
        // URL에서 work 파라미터 제거 (브라우저 히스토리 업데이트)
        const url = new URL(window.location);
        url.searchParams.delete('work');
        window.history.replaceState({}, '', url);
      }
    }
  }, [searchParams, ocrHistory]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setExtractedText('');
      setExtractedTable('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedText('');
    setExtractedTable('');
  };

  // 텍스트 결과 다운로드
  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_text_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 테이블 결과 다운로드
  const downloadTable = () => {
    const blob = new Blob([extractedTable], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_table_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunOcr = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      // 1. 파일 업로드 서버로 파일 업로드 (프록시 API 사용)
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/file-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('파일 업로드 실패');
      }
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || '파일 업로드 실패');
      }
      
      console.log('파일 업로드 성공:', uploadResult.file);
      
      // 2. OCR 실행
      const ocrRequestBody = {
        filename: uploadResult.file.savedName,
        tool: selectedTool,
        filePath: uploadResult.file.path
      };
      
      console.log('OCR 요청 시작:', ocrRequestBody);
      
      const ocrResponse = await fetch('/api/ocrmcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ocrRequestBody),
      });
      
      console.log('OCR 응답 상태:', ocrResponse.status);
      
      if (!ocrResponse.ok) {
        throw new Error('OCR 실행 실패');
      }
      
      const result = await ocrResponse.json();
      console.log('OCR 처리 결과:', result);
      
      // 3. 결과 설정
      const extractedTextResult = result.text || '텍스트 추출 결과가 없습니다.';
      const extractedTableResult = result.table || '테이블 추출 결과가 없습니다.';
      
      setExtractedText(extractedTextResult);
      setExtractedTable(extractedTableResult);
      
      // 4. 결과 저장
      await saveOcrResult(uploadResult.file.savedName, selectedTool, extractedTextResult, extractedTableResult);
      
    } catch (error) {
      console.error('OCR 처리 중 오류:', error);
      setExtractedText(`오류가 발생했습니다: ${error.message}`);
      setExtractedTable('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="AI OCR" />

      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* 왼쪽 사이드바 - 작업 목록 */}
          <div className="w-80 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
            {/* 상단 헤더 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">OCR 작업 목록</h2>
                <button
                  onClick={startNewWork}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="새 작업 시작"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {/* 검색 바 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="작업 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 작업 목록 */}
            <div className="flex-1 overflow-y-auto">
              {ocrHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">아직 OCR 작업이 없습니다.</p>
                  <p className="text-xs text-gray-400 mt-1">파일을 업로드하고 OCR을 실행해보세요.</p>
                </div>
              ) : (
                <div className="p-2">
                  {ocrHistory
                    .filter(work => 
                      work.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      work.extractedText.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((work) => (
                      <div
                        key={work._id}
                        onClick={() => selectWork(work)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 group ${
                          currentSessionId === work._id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                work.tool === 'pdf' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {work.tool === 'pdf' ? 'PDF' : 'IMG'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(work.createdAt)}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
                              {work.originalFilename}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {work.extractedText.substring(0, 100)}...
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmed = window.confirm('정말 삭제하시겠습니까? 선택한 OCR 작업과 파일이 삭제됩니다.');
                                if (confirmed) {
                                  deleteOcrResult(work._id);
                                }
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 메인 영역 - OCR 기능 */}
          <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* 툴 선택 버튼 */}
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedTool === 'pdf' ? 'PDF 파서 모드' : '이미지 OCR 모드'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedTool === 'pdf' 
                        ? 'PDF에서 텍스트와 테이블을 추출합니다' 
                        : '이미지에서 텍스트를 추출합니다'
                      }
                    </p>
                  </div>
                  <div className="relative dropdown-container">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <FileUp size={16} />
                      {selectedTool === 'pdf' ? 'PDF Parser 모드' : 'IMG OCR 모드'}
                      <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          <div
                            onClick={() => {
                              setSelectedTool('pdf');
                              setIsDropdownOpen(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedTool === 'pdf'
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="text-blue-600" size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm">📄 PDF Parser</h4>
                                <p className="text-xs text-gray-600">PDF에서 텍스트와 테이블을 추출합니다</p>
                              </div>
                            </div>
                          </div>
                          
                          <div
                            onClick={() => {
                              setSelectedTool('img');
                              setIsDropdownOpen(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedTool === 'img'
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Image className="text-purple-600" size={20} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm">🖼️ IMG OCR</h4>
                                <p className="text-xs text-gray-600">이미지에서 텍스트를 추출합니다</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 파일 업로드 영역 */}
                <div 
                  {...getRootProps()} 
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 cursor-pointer mb-6
                    ${isDragActive ? 'border-[#3B86F6] bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag 'n' drop a PDF or image, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, PNG, JPG, WEBP
                  </p>
                  {file && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">{file.name}</span>
                        <button
                          onClick={handleRemoveFile}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OCR 실행 버튼 */}
                <div className="text-center mb-6">
                  <button
                    onClick={handleRunOcr}
                    disabled={!file || isLoading}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto ${
                      !file || isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} />
                        Run OCR
                      </>
                    )}
                  </button>
                </div>

                {/* 결과 표시 영역 */}
                {(extractedText || extractedTable) && (
                  <div className="space-y-6">
                    {/* 텍스트 추출 결과 */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">📝 텍스트 추출 결과</h2>
                        <button
                          onClick={downloadText}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download size={14} />
                          텍스트 다운로드
                        </button>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[200px]">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{extractedText}</pre>
                      </div>
                    </div>

                    {/* 테이블 추출 결과 */}
                    {extractedTable && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-gray-800">📊 테이블 추출 결과</h2>
                          <button
                            onClick={downloadTable}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Download size={14} />
                            테이블 다운로드
                          </button>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[200px]">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{extractedTable}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AiOcrPage);