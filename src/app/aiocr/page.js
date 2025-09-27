'use client';

import React, { useState, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { UploadCloud, FileText, X, Loader2, Wand2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function AiOcrPage() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setExtractedText('');
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
  };

  const handleRunOcr = () => {
    setIsLoading(true);
    // Simulate OCR processing
    setTimeout(() => {
      const mockText = `
        Extracted Text from ${file.name}:

        SIWASOFT Business Plan - Q4 2025

        1. Executive Summary
           - Expansion of AI-driven RPA solutions.
           - Focus on LLM and OCR integration for enterprise clients.

        2. Market Analysis
           - Growing demand for automated document processing.
           - Competitor landscape shows a gap in user-friendly AI tools.

        3. Financial Projections
           - Projected revenue growth of 25% QoQ.
           - Investment in R&D to maintain a competitive edge.
      `;
      setExtractedText(mockText);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="AI OCR" />

      <div className="max-w-4xl mx-auto">
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

        {extractedText && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">텍스트 추출 결과</h2>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{extractedText}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
  