'use client';

import React, { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { UploadCloud, FileText, X, Loader2, Wand2, FileUp, Bot, Search, Image } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import withAuth from '@/components/withAuth';

function AiOcrPage() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedTable, setExtractedTable] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('pdf'); // 'pdf' or 'img'
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRunOcr = async () => {
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      // 1. 파일을 Base64로 변환
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result;
          
          // 2. PDF 업로드
          const uploadResponse = await fetch('/api/upload-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64Data,
              filename: file.name
            }),
          });
          
          if (!uploadResponse.ok) {
            throw new Error('PDF 업로드 실패');
          }
          
          const uploadResult = await uploadResponse.json();
          
          // 3. OCR 실행
          const ocrResponse = await fetch('/api/ocrmcp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: uploadResult.filename,
              tool: selectedTool
            }),
          });
          
          if (!ocrResponse.ok) {
            throw new Error('OCR 실행 실패');
          }
          
          const result = await ocrResponse.json();
          
          // 4. 결과 설정
          setExtractedText(result.text || '텍스트 추출 결과가 없습니다.');
          setExtractedTable(result.table || '테이블 추출 결과가 없습니다.');
          
        } catch (error) {
          console.error('OCR 처리 중 오류:', error);
          setExtractedText(`오류가 발생했습니다: ${error.message}`);
          setExtractedTable('');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('파일 읽기 오류:', error);
      setExtractedText(`파일 읽기 오류: ${error.message}`);
      setExtractedTable('');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="AI OCR" />

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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <FileUp size={16} />
            Select Tool
          </button>
        </div>
        <div 
          {...getRootProps()} 
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 cursor-pointer
            ${isDragActive ? 'border-[#3B86F6] bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-gray-500">
            <UploadCloud size={48} className={`mb-4 transition-transform duration-300 ${isDragActive ? 'transform scale-110 text-blue-600' : 'text-gray-400'}`} />
            <p className="text-lg font-semibold">
              {isDragActive ? 'Drop the file here ...' : "Drag 'n' drop a PDF or image, or click to select"}
            </p>
            <p className="text-sm text-gray-400 mt-1">Supported formats: PDF, PNG, JPG, WEBP</p>
          </div>
        </div>

        {file && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-[#3B86F6]" />
              <span className="font-semibold text-gray-700">{file.name}</span>
              <span className="text-sm text-gray-500">- {(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button 
              onClick={handleRemoveFile}
              className="p-1.5 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleRunOcr}
            disabled={!file || isLoading}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300
              disabled:bg-gray-300 disabled:cursor-not-allowed
              hover:bg-blue-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B86F6]"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                Run OCR
              </>
            )}
          </button>
        </div>

        {(extractedText || extractedTable) && (
          <div className="mt-8 space-y-6">
            {extractedText && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 텍스트 추출 결과</h2>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[200px]">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{extractedText}</pre>
                </div>
              </div>
            )}
            
            {extractedTable && selectedTool === 'pdf' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 테이블 추출 결과</h2>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[200px]">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{extractedTable}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tool Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">툴 선택</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* PDF Parser Tool */}
              <div
                onClick={() => {
                  setSelectedTool('pdf');
                  setIsModalOpen(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTool === 'pdf'
                    ? 'border-[#3B86F6] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">📄 PDF Parser</h4>
                    <p className="text-sm text-gray-600">PDF에서 텍스트와 테이블을 추출합니다</p>
                  </div>
                </div>
              </div>

              {/* IMG OCR Tool */}
              <div
                onClick={() => {
                  setSelectedTool('img');
                  setIsModalOpen(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTool === 'img'
                    ? 'border-[#3B86F6] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Image className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800"> IMG OCR</h4>
                    <p className="text-sm text-gray-600">이미지에서 텍스트를 추출합니다</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[#3B86F6] text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                선택
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AiOcrPage);
  