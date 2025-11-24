'use client';

import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Search, Plus, Paperclip, SendHorizontal, FileUp, Bot, User, Edit2, Trash2, MoreVertical } from 'lucide-react';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function AiLlmPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('chatbot'); // 'chatbot', 'embed', 'gitagent', or 'nerp'
  const [withAnswer, setWithAnswer] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0);
  const messagesEndRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  // 채팅방 관리 상태
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 이미지 업로드 관련 상태
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [extractedImageData, setExtractedImageData] = useState(null); // 구조화된 데이터
  const fileInputRef = useRef(null);

  // 동적 "생각 중입니다" 메시지들
  const thinkingMessages = [
    '생각 중입니다',
    '질문을 분석하고 있습니다',
    '관련 정보를 검색하고 있습니다',
    '답변을 추론하고 있습니다',
    '최종 답변을 준비하고 있습니다'
  ];

  // 박스 문자 테이블을 파싱하는 함수
  const parseBoxTable = (text) => {
    const lines = text.split('\n');
    const result = [];
    let currentSection = null;
    let currentSectionLines = [];
    let inBox = false;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // 박스 시작 (┌─ 로 시작)
      if (trimmedLine.startsWith('┌─') || trimmedLine.startsWith('┌')) {
        // 이전 섹션 처리
        if (currentSection && currentSectionLines.length > 0) {
          const html = convertBoxSectionToHTML(currentSection, currentSectionLines);
          result.push({ type: 'html', content: html });
          currentSectionLines = [];
        }
        
        // 새 섹션 시작 - ┌─ 제목 ──┐ 형식에서 제목 추출
        const sectionMatch = trimmedLine.match(/┌─\s*([^─]+?)(?:\s*─+)?\s*┐/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].trim();
        } else {
          // ┌─ 없이 ┌로만 시작하는 경우
          const altMatch = trimmedLine.match(/┌\s*([^┐]+)/);
          if (altMatch) {
            currentSection = altMatch[1].trim();
          } else {
            currentSection = '정보';
          }
        }
        inBox = true;
        return;
      }
      
      // 박스 끝 (└로 시작)
      if (trimmedLine.startsWith('└')) {
        inBox = false;
        // 섹션 처리
        if (currentSection && currentSectionLines.length > 0) {
          const html = convertBoxSectionToHTML(currentSection, currentSectionLines);
          result.push({ type: 'html', content: html });
          currentSection = null;
          currentSectionLines = [];
        }
        return;
      }
      
      // 박스 내부 라인 (│로 시작)
      if (inBox && (trimmedLine.startsWith('│') || trimmedLine.includes('│'))) {
        // 구분선 제거 (├─, ┤, ┼ 등으로만 구성된 줄)
        if (!trimmedLine.match(/^[├┤┼─\s│]+$/)) {
          currentSectionLines.push(line);
        }
        return;
      }
      
      // 박스 내부 빈 줄은 무시
      if (inBox && !trimmedLine) {
        return;
      }
      
      // 박스 외부 텍스트
      if (!inBox && trimmedLine) {
        if (currentSection && currentSectionLines.length > 0) {
          const html = convertBoxSectionToHTML(currentSection, currentSectionLines);
          result.push({ type: 'html', content: html });
          currentSection = null;
          currentSectionLines = [];
        }
        result.push({ type: 'text', content: line });
      }
    });
    
    // 마지막 섹션 처리
    if (currentSection && currentSectionLines.length > 0) {
      const html = convertBoxSectionToHTML(currentSection, currentSectionLines);
      result.push({ type: 'html', content: html });
    }
    
    return result.map(item => item.content).join('\n');
  };
  
  // 박스 섹션을 HTML로 변환하는 함수
  const convertBoxSectionToHTML = (sectionTitle, lines) => {
    if (lines.length === 0) return '';
    
    // 첫 번째 라인에서 헤더 추출 시도 (테이블 형식인지 확인)
    const firstLine = lines[0].trim();
    const hasTableHeaders = firstLine.includes('│') && firstLine.split('│').length > 3;
    
    if (hasTableHeaders) {
      // 테이블 형식 (세금계산서 세부내역 같은 경우)
      return convertBoxTableToHTML(sectionTitle, lines);
    } else {
      // 키-값 형식 (업체정보, 계산서 정보 같은 경우)
      return convertBoxKeyValueToHTML(sectionTitle, lines);
    }
  };
  
  // 박스 테이블을 HTML 테이블로 변환
  const convertBoxTableToHTML = (sectionTitle, lines) => {
    if (lines.length === 0) return '';
    
    // 헤더 추출 (첫 번째 라인)
    const headerLine = lines[0].trim();
    // │로 split하고, 첫 번째와 마지막 빈 요소 제거, 나머지는 모두 유지 (빈 셀 포함)
    const headerParts = headerLine.split('│');
    // 첫 번째와 마지막이 빈 문자열이거나 경계 문자만 있는 경우 제거
    const headers = headerParts
      .slice(1, -1) // 첫 번째와 마지막 제거
      .map(h => h.trim())
      .map(h => h.match(/^[├┤┼─\s]+$/) ? '' : h); // 구분선 문자만 있으면 빈 문자열로
    
    if (headers.length === 0) return '';
    
    // 데이터 행 추출
    const dataRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('│') && !line.match(/^[├┤┼─\s│]+$/)) {
        // │로 split하고, 첫 번째와 마지막 빈 요소 제거, 나머지는 모두 유지 (빈 셀 포함)
        const cellParts = line.split('│');
        const cells = cellParts
          .slice(1, -1) // 첫 번째와 마지막 제거
          .map(c => c.trim())
          .map(c => c.match(/^[├┤┼─\s]+$/) ? '' : c); // 구분선 문자만 있으면 빈 문자열로
        
        // 헤더 개수와 맞추기 위해 빈 셀 추가
        while (cells.length < headers.length) {
          cells.push('');
        }
        
        if (cells.length > 0) {
          dataRows.push(cells);
        }
      }
    }
    
    // HTML 테이블 생성
    let html = `<div class="mb-6">`;
    html += `<h3 class="text-lg font-semibold text-gray-800 mb-3">${sectionTitle}</h3>`;
    html += `<div class="overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300 text-sm bg-white shadow-sm">`;
    
    // 헤더
    html += '<thead><tr class="bg-gray-100">';
    headers.forEach(header => {
      html += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">${header}</th>`;
    });
    html += '</tr></thead>';
    
    // 바디
    html += '<tbody>';
    dataRows.forEach((row, rowIndex) => {
      html += `<tr class="${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors">`;
      headers.forEach((header, colIndex) => {
        // 헤더 개수만큼 셀을 표시 (빈 셀도 유지)
        const cell = row[colIndex] !== undefined ? row[colIndex] : '';
        // 숫자 정렬 (숫자로 시작하거나 숫자와 콤마, 마이너스 포함)
        const isNumeric = cell && /^-?[\d,]+/.test(cell.trim());
        const alignClass = isNumeric ? 'text-right' : 'text-left';
        html += `<td class="border border-gray-300 px-4 py-2 ${alignClass} text-gray-800">${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    
    return html;
  };
  
  // 박스 키-값 형식을 HTML로 변환
  const convertBoxKeyValueToHTML = (sectionTitle, lines) => {
    const data = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('│')) {
        // │ 키 : 값 │ 형식 파싱
        const content = trimmedLine.replace(/^│\s*/, '').replace(/\s*│$/, '').trim();
        const match = content.match(/^(.+?)\s*:\s*(.+)$/);
        if (match) {
          data.push({ key: match[1].trim(), value: match[2].trim() });
        }
      }
    });
    
    if (data.length === 0) return '';
    
    let html = `<div class="mb-6">`;
    html += `<h3 class="text-lg font-semibold text-gray-800 mb-3">${sectionTitle}</h3>`;
    html += `<div class="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">`;
    html += '<table class="min-w-full">';
    html += '<tbody>';
    
    data.forEach((item, index) => {
      html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
      html += `<td class="px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 w-1/3">${item.key}</td>`;
      html += `<td class="px-4 py-3 text-gray-800 border-b border-gray-200">${item.value}</td>`;
      html += '</tr>';
    });
    
    html += '</tbody></table></div></div>';
    
    return html;
  };

  // 마크다운 테이블을 HTML 테이블로 변환하는 함수
  const parseMarkdownTable = (text) => {
    const lines = text.split('\n');
    const result = [];
    let currentTable = [];
    let inTable = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 테이블 행인지 확인 (|로 시작하거나 포함)
      if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
        // 구분선인지 확인 (--- 또는 :---: 같은 패턴)
        const isSeparator = /^[\|\s\-:]+$/.test(trimmedLine);
        
        if (!isSeparator) {
          if (!inTable) {
            inTable = true;
            currentTable = [];
          }
          currentTable.push(line); // 원본 줄 유지 (공백 포함)
        }
        // 구분선은 무시
      } else {
        // 테이블이 끝남
        if (inTable && currentTable.length > 0) {
          // 테이블을 HTML로 변환
          const htmlTable = convertTableToHTML(currentTable);
          result.push({ type: 'table', content: htmlTable, originalLines: currentTable.length });
          currentTable = [];
        }
        inTable = false;
        result.push({ type: 'text', content: line });
      }
    });
    
    // 마지막 테이블 처리
    if (inTable && currentTable.length > 0) {
      const htmlTable = convertTableToHTML(currentTable);
      result.push({ type: 'table', content: htmlTable, originalLines: currentTable.length });
    }
    
    // 결과를 문자열로 조합
    return result.map(item => item.content).join('\n');
  };
  
  // 테이블 배열을 HTML 테이블로 변환하는 헬퍼 함수
  const convertTableToHTML = (tableLines) => {
    if (tableLines.length === 0) return '';
    
    // 헤더 추출 (첫 번째 줄)
    const headerLine = tableLines[0].trim();
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    
    if (headers.length === 0) return tableLines.join('\n');
    
    // 데이터 행 추출 (나머지 줄들)
    const dataLines = tableLines.slice(1).map(line => line.trim());
    
    // HTML 테이블 생성
    let htmlTable = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 text-sm">';
    
    // 헤더
    htmlTable += '<thead><tr class="bg-gray-100">';
    headers.forEach(header => {
      htmlTable += `<th class="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">${header}</th>`;
    });
    htmlTable += '</tr></thead>';
    
    // 바디
    htmlTable += '<tbody>';
    dataLines.forEach((line, rowIndex) => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0) {
        htmlTable += `<tr class="${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
        cells.forEach((cell) => {
          // 숫자 정렬 (숫자로 시작하거나 숫자와 콤마, 마이너스 포함)
          const isNumeric = /^-?[\d,]+/.test(cell.trim());
          const alignClass = isNumeric ? 'text-right' : 'text-left';
          htmlTable += `<td class="border border-gray-300 px-3 py-2 ${alignClass} text-gray-800">${cell}</td>`;
        });
        htmlTable += '</tr>';
      }
    });
    htmlTable += '</tbody></table></div>';
    
    return htmlTable;
  };

  // 출처 텍스트를 클릭 가능한 링크로 변환하는 함수
  const renderSourceLinks = (text, evidence = []) => {
    if (!text) {
      return text;
    }

    // PDF 뷰어 기본 URL 결정: workbuilder.co.kr 도메인이면 IP 주소 사용
    const getPdfViewerBase = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        // workbuilder.co.kr 도메인이면 IP 주소 사용
        if (hostname.includes('workbuilder.co.kr') || hostname.includes('vercel.app')) {
          // 항상 IP 주소 사용 (혼합 콘텐츠 문제 방지)
          return 'http://221.139.227.131:3000';
        }
        // 로컬 개발 환경에서도 IP 주소 사용 (일관성)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://221.139.227.131:3000';
        }
      }
      // 기본값: IP 주소 사용
      return 'http://221.139.227.131:3000';
    };

    // [출처: ...] 패턴 찾기
    const sourcePattern = /\[출처:\s*([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = sourcePattern.exec(text)) !== null) {
      // 매치 이전 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      let sourceText = match[1].trim();
      
      // 디버깅: 출처 텍스트와 evidence 로그
      console.log('🔍 원본 출처 텍스트:', sourceText);
      console.log('📚 Evidence:', evidence);
      
      // 컬렉션 이름 제거: [docs agent], [collection_name] 등 (앞뒤 모두)
      // "[docs agent] WorkBuilder 사용자 매뉴얼 - p.4" -> "WorkBuilder 사용자 매뉴얼 - p.4"
      // "[docs agent]. WorkBuilder 사용자 매뉴얼 p.5" -> "WorkBuilder 사용자 매뉴얼 p.5"
      sourceText = sourceText
        .replace(/^\[[^\]]+\]\s*\.?\s*/g, '') // 앞의 [docs agent]. 제거
        .replace(/\s*\[[^\]]+\]\s*/g, ' ') // 중간이나 뒤의 [docs agent] 제거
        .trim();
      console.log('🔍 컬렉션 이름 제거 후:', sourceText);
      
      // 출처 텍스트에서 PDF 이름과 페이지 번호 추출
      // 형식: "WorkBuilder 사용자 매뉴얼 - p.4", "WorkBuilder 사용자 매뉴얼 p.5, p.7", "WorkBuilder 사용자 매뉴얼ㆍ p.96" 등
      let pdfName = null;
      let pageNum = null;
      
      // 페이지 번호 추출 (다양한 형식 지원, 첫 번째 페이지 번호만 사용)
      // - p.4, p.5, p.7, ㆍ p.96, p.21 등
      // 여러 페이지가 있으면 첫 번째만 사용: "p.5, p.7" -> 5
      const pageMatch = sourceText.match(/[-\sㆍ·]\s*p\.(\d+)/i) || 
                       sourceText.match(/,\s*p\.(\d+)/i) ||
                       sourceText.match(/\sp\.(\d+)/i);
      if (pageMatch) {
        pageNum = parseInt(pageMatch[1], 10);
        console.log('📄 출처 텍스트에서 페이지 번호 추출:', pageNum);
      }
      
      // PDF 이름 추출 (페이지 번호 부분 제거)
      // "WorkBuilder 사용자 매뉴얼 - p.4" -> "WorkBuilder 사용자 매뉴얼"
      // "WorkBuilder 사용자 매뉴얼 p.5, p.7" -> "WorkBuilder 사용자 매뉴얼"
      let pdfNameText = sourceText
        .replace(/[-\sㆍ·]\s*p\.\d+/gi, '') // - p.4, ㆍ p.96 제거
        .replace(/,\s*p\.\d+/gi, '') // , p.7 제거
        .replace(/\s+p\.\d+/gi, '') // p.5 제거
        .replace(/\s*-\s*$/, '') // 끝의 - 제거
        .replace(/\s*,\s*$/, '') // 끝의 , 제거
        .replace(/\s+/g, ' ') // 연속된 공백을 하나로
        .trim();
      
      console.log('📄 추출된 PDF 이름:', pdfNameText, '페이지 번호:', pageNum);
      
      // evidence에서 매칭되는 항목 찾기 (유연한 매칭)
      let evidenceItem = null;
      
      if (evidence && evidence.length > 0) {
        // 1. 정확한 source_label 매칭 시도
        evidenceItem = evidence.find(item => item.source_label === sourceText);
        
        // 2. PDF 이름과 페이지로 매칭 시도 (페이지 번호가 있으면 우선)
        if (!evidenceItem && pdfNameText && pageNum) {
          evidenceItem = evidence.find(item => {
            const itemPdfName = item.pdf_name || item.meta?.pdf_name;
            const itemPage = item.page || item.meta?.page;
            
            // PDF 이름이 포함되어 있고, 페이지가 일치하는 경우
            if (itemPdfName && (pdfNameText.includes(itemPdfName) || itemPdfName.includes(pdfNameText))) {
              if (itemPage) {
                return itemPage === pageNum;
              }
            }
            return false;
          });
        }
        
        // 3. PDF 이름만으로 매칭 시도 (페이지 번호가 없거나 위에서 매칭 실패한 경우)
        if (!evidenceItem && pdfNameText) {
          evidenceItem = evidence.find(item => {
            const itemPdfName = item.pdf_name || item.meta?.pdf_name;
            if (itemPdfName) {
              // 양방향 포함 검사
              return pdfNameText.includes(itemPdfName) || itemPdfName.includes(pdfNameText);
            }
            return false;
          });
        }
        
        // 4. source_label에 PDF 이름이 포함된 경우
        if (!evidenceItem && pdfNameText) {
          evidenceItem = evidence.find(item => {
            const sourceLabel = item.source_label || '';
            return sourceLabel.includes(pdfNameText) || pdfNameText.includes(sourceLabel);
          });
        }
      }
      
      // PDF 정보가 있으면 링크 생성
      if (evidenceItem) {
        const foundPdfName = evidenceItem.pdf_name || evidenceItem.meta?.pdf_name;
        // 출처 텍스트에서 직접 추출한 페이지 번호를 우선 사용 (가장 정확함)
        // evidence의 페이지 번호는 fallback으로만 사용
        const foundPage = pageNum || evidenceItem.page || evidenceItem.meta?.page;
        
        console.log('✅ Evidence 매칭 성공:', { 
          foundPdfName, 
          foundPage, 
          pageNumFromText: pageNum,
          pageNumFromEvidence: evidenceItem.page || evidenceItem.meta?.page
        });
        
        if (foundPdfName) {
          const baseUrl = getPdfViewerBase();
          const pdfUrl = `${baseUrl}/pdf-viewer?pdf_name=${encodeURIComponent(foundPdfName)}${foundPage ? `&page=${foundPage}` : ''}`;
          console.log('🔗 PDF URL:', pdfUrl);
          parts.push(
            <a
              key={match.index}
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.open(pdfUrl, '_blank', 'width=1200,height=800');
              }}
            >
              {match[0]}
            </a>
          );
        } else {
          console.warn('⚠️ Evidence에 PDF 이름이 없음');
          // PDF 이름이 없으면 원본 텍스트 유지
          parts.push(match[0]);
        }
      } else {
        // evidence를 찾지 못한 경우, 출처 텍스트에서 직접 PDF 이름 추출 시도
        // 예: "WorkBuilder 사용자 매뉴얼" -> "WorkBuilder 사용자 매뉴얼"
        console.log('⚠️ Evidence 매칭 실패, 출처 텍스트에서 직접 추출 시도:', pdfNameText);
        if (pdfNameText) {
          const baseUrl = getPdfViewerBase();
          const pdfUrl = `${baseUrl}/pdf-viewer?pdf_name=${encodeURIComponent(pdfNameText)}${pageNum ? `&page=${pageNum}` : ''}`;
          console.log('🔗 PDF URL (직접 추출):', pdfUrl);
          parts.push(
            <a
              key={match.index}
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.open(pdfUrl, '_blank', 'width=1200,height=800');
              }}
            >
              {match[0]}
            </a>
          );
        } else {
          console.warn('❌ PDF 이름 추출 실패');
          // 매칭 실패 시 원본 텍스트 유지
          parts.push(match[0]);
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // 마지막 부분 추가
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // 메시지 텍스트를 렌더링하는 함수 (테이블 변환 포함)
  const renderMessageText = (text, isNerpMode = false, evidence = []) => {
    if (!isNerpMode) {
      // 출처 링크 변환 적용
      const textWithLinks = renderSourceLinks(text, evidence);
      if (Array.isArray(textWithLinks)) {
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{textWithLinks}</p>;
      }
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
    }
    
    // 박스 문자 테이블이 있는지 확인 (┌─ 또는 ┌로 시작)
    const hasBoxTable = text.includes('┌─') || text.includes('┌') || text.includes('│');
    
    let processedText;
    if (hasBoxTable) {
      // 박스 문자 테이블 파싱
      processedText = parseBoxTable(text);
    } else {
      // 마크다운 테이블 파싱
      processedText = parseMarkdownTable(text);
    }
    
    // HTML이 포함되어 있는지 확인
    if (processedText.includes('<table') || processedText.includes('<div class="mb-6">')) {
      return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processedText }} />;
    }
    
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, []);

  // URL 파라미터에서 세션 ID 처리
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessionId !== currentSessionId) {
      selectSession(sessionId);
    }
  }, [searchParams, currentSessionId]);

  // 동적 메시지 업데이트 함수
  const updateThinkingMessage = () => {
    setCurrentThinkingMessage(prev => (prev + 1) % thinkingMessages.length);
  };

  // 로딩 시작 시 메시지 업데이트 시작
  const startThinkingAnimation = () => {
    setCurrentThinkingMessage(0);
    thinkingIntervalRef.current = setInterval(updateThinkingMessage, 10000); // 10초마다 변경
  };

  // 로딩 종료 시 메시지 업데이트 중지
  const stopThinkingAnimation = () => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  };

  // 채팅방 관리 함수들
  const fetchChatSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions');
      const data = await response.json();
      if (data.success) {
        console.log('Fetched sessions:', data.sessions);
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      setIsCreatingSession(true);
      console.log('Creating new session...');
      
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '새 대화',
          firstMessage: null
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session created:', data);
      
      if (data.success) {
        setChatSessions(prev => [data.session, ...prev]);
        setCurrentSessionId(data.session._id);
        setMessages([]);
        setHasStarted(false);
        return data.session._id; // 생성된 세션 ID 반환
      } else {
        console.error('Failed to create session:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      alert('채팅방 생성에 실패했습니다: ' + error.message);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const selectSession = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentSessionId(sessionId);
        setMessages(data.messages);
        setHasStarted(data.messages.length > 0);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          title: newTitle
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setChatSessions(prev => 
          prev.map(session => 
            session._id === sessionId 
              ? { ...session, title: newTitle }
              : session
          )
        );
        setEditingSessionId(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('정말로 이 대화를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/chat-sessions?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setChatSessions(prev => prev.filter(session => session._id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          setHasStarted(false);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const saveMessageToSession = async (message, sessionId) => {
    if (!sessionId) return;
    
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateMessageInSession = async (thinkingMessageId, newMessage, sessionId) => {
    if (!sessionId) return;
    
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thinkingMessageId,
          newMessage
        })
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // 데이터베이스 정리 함수 (개발용)
  const cleanDatabase = async () => {
    if (!confirm('모든 채팅방을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Database cleaned:', data.message);
        setChatSessions([]);
        setCurrentSessionId(null);
        setMessages([]);
        setHasStarted(false);
        alert('데이터베이스가 정리되었습니다.');
      }
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  };

  // 컴포넌트 마운트 시 채팅방 목록 로드
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 자동 제목 생성 함수
  const generateAutoTitle = (input) => {
    // 입력 텍스트 정리
    let title = input.trim();
    
    // 특수문자 제거 및 정리
    title = title.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 길이 조정
    if (title.length > 25) {
      title = title.substring(0, 25) + '...';
    }
    
    // 빈 문자열인 경우 기본 제목
    if (!title) {
      title = '새 대화';
    }
    
    return title;
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    setSelectedImage(file);
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 제거 핸들러
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 이미지에서 텍스트 추출 (Google Vision API)
  const extractTextFromImage = async (imageBase64) => {
    try {
      setIsExtractingImage(true);
      const response = await fetch('/api/vision-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 })
      });

      if (!response.ok) {
        throw new Error('이미지 텍스트 추출 실패');
      }

      const data = await response.json();
      console.log('Vision API 응답:', data); // 디버깅용
      // 구조화된 데이터 저장
      setExtractedImageData(data.formatted || null);
      // 구조화된 데이터와 텍스트 모두 반환
      return {
        extractedText: data.extractedText || '',
        formatted: data.formatted || null
      };
    } catch (error) {
      console.error('Image extraction error:', error);
      alert('이미지에서 텍스트를 추출하는데 실패했습니다: ' + error.message);
      return {
        extractedText: '',
        formatted: null
      };
    } finally {
      setIsExtractingImage(false);
    }
  };


  const handleSend = async (e) => {
    e.preventDefault();
    if ((input.trim() === '' && !selectedImage) || isLoading || isExtractingImage) return;

    let sessionId = currentSessionId;
    
    // 현재 세션이 없으면 새 세션 생성
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        console.error('Failed to create session');
        return;
      }
    }

    // ===== 실제 검색 쿼리 구성 =====
    const searchQuery = input.trim();
    console.log('🔍 실제 검색 쿼리:', searchQuery); // 디버깅용

    // 탄소배출량 모드에서 이미지만 있는 경우는 허용
    if (!searchQuery && !selectedImage) {
      alert('텍스트를 입력하거나 이미지를 업로드해주세요.');
      return;
    }

    // 첫 메시지 전, 세션 제목을 즉시 업데이트 (ChatGPT 스타일)
    if (!hasStarted && searchQuery) {
      const newTitle = generateAutoTitle(searchQuery);
      setChatSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, title: newTitle } : s)));
      updateSessionTitle(sessionId, newTitle);
    }

    // 첫 메시지인 경우 환영 메시지 추가
    if (!hasStarted) {
      const welcomeMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `안녕하세요! AI 어시스턴트입니다. ${selectedTool === 'chatbot' ? '챗봇 모드' : selectedTool === 'embed' ? '임베딩 검색 모드' : selectedTool === 'gitagent' ? 'Git Agent 모드' : '세금계산서 발행 모드'}로 도움을 드리겠습니다. 무엇을 도와드릴까요?`,
      };
      setMessages([welcomeMessage]);
      setHasStarted(true);
      await saveMessageToSession(welcomeMessage, sessionId);
    }

    // ===== 화면 표시용 메시지 구성 =====
    const userMessageText = input.trim() || '[이미지 업로드됨]';

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      image: selectedImage ? imagePreview : null,
    };
    
    setMessages(prev => [...prev, userMessage]);
    await saveMessageToSession(userMessage, sessionId);
    
    const currentInput = searchQuery;
    setInput('');
    setIsLoading(true);
    setResponseTime(null);
    
    // 이미지 초기화
    handleImageRemove();

    // 동적 메시지 애니메이션 시작
    startThinkingAnimation();

    // "생각 중입니다" 메시지 추가
    const thinkingMessage = {
      id: `thinking-${Date.now()}`,
      sender: 'bot',
      text: thinkingMessages[0],
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);
    await saveMessageToSession(thinkingMessage, sessionId);

    const startTime = Date.now();

    try {
      // 탄소배출량 모드에서 이미지가 있으면 epdimg로 전환
      const actualTool = (selectedTool === 'chatbot' && selectedImage) ? 'epdimg' : selectedTool;
      
      // epdimg 모드일 때는 이미지를 base64로 인코딩하여 전송
      let requestBody;
      let headers = {
        'Content-Type': 'application/json',
      };
      
      if (actualTool === 'epdimg' && selectedImage) {
        console.log('🖼️ 이미지 base64 변환 시작...', {
          fileName: selectedImage.name,
          fileSize: selectedImage.size,
          fileType: selectedImage.type
        });
        
        // 이미지를 base64로 변환
        const imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              // data:image/jpeg;base64, 부분 제거
              const base64 = reader.result.split(',')[1];
              console.log('✅ Base64 변환 완료, 길이:', base64.length);
              resolve(base64);
            } catch (error) {
              console.error('❌ Base64 변환 오류:', error);
              reject(error);
            }
          };
          reader.onerror = (error) => {
            console.error('❌ FileReader 오류:', error);
            reject(error);
          };
          reader.readAsDataURL(selectedImage);
        });
        
        requestBody = {
          tool: actualTool,
          imageBase64: imageBase64,
          imageName: selectedImage.name,
          imageType: selectedImage.type,
          query: currentInput || ''
        };
        
        console.log('📦 요청 바디 준비 완료:', {
          tool: actualTool,
          hasImageBase64: !!imageBase64,
          imageBase64Length: imageBase64.length,
          imageName: selectedImage.name,
          imageType: selectedImage.type,
          query: currentInput || ''
        });
      } else {
        // 기존 방식 (JSON)
        requestBody = {
          query: currentInput || '',
          tool: actualTool,
          with_answer: withAnswer
        };
      }
      
      console.log('📤 요청 전송 시작:', {
        tool: actualTool,
        hasImage: !!selectedImage,
        queryLength: currentInput ? currentInput.length : 0,
        queryPreview: currentInput ? currentInput.substring(0, 100) : '없음',
        requestBodySize: JSON.stringify(requestBody).length
      });

      // 타임아웃 설정 (10분)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ 요청 타임아웃 (10분)');
        controller.abort();
      }, 10 * 60 * 1000);

      let response;
      try {
        response = await fetch('/api/chatmcp', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('❌ Fetch 오류:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        if (fetchError.name === 'AbortError') {
          throw new Error('요청 시간 초과 (10분). 서버가 응답하지 않습니다.');
        }
        throw new Error(`네트워크 오류: ${fetchError.message}`);
      }

      console.log('📥 응답 받음:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = '응답 본문을 읽을 수 없습니다.';
        }
        console.error('❌ 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        });
        throw new Error(`서버 오류 (${response.status}): ${errorText.substring(0, 200)}`);
      }

      console.log('📥 JSON 파싱 시작...');
      let data;
      try {
        const responseText = await response.text();
        console.log('📥 Raw response (첫 500자):', responseText.substring(0, 500));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError);
        throw new Error(`응답 파싱 실패: ${parseError.message}`);
      }
      
      console.log('✅ JSON 파싱 완료:', {
        hasResponse: !!data.response,
        hasChatbotResult: !!data.chatbot_result,
        keys: Object.keys(data)
      });
      
      // 응답 시간 계산
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
      setResponseTime(timeTaken);
      
      let responseText;
      if (selectedTool === 'chatbot' || actualTool === 'epdimg') {
        // epdimg 모드일 때는 response 필드를 우선 사용 (app.py에서 이미 최종 답변 반환)
        if (actualTool === 'epdimg') {
          responseText = data.response || data.chatbot_result?.response || data.answer || 'Sorry, I could not process your request.';
        } else {
          responseText = data.response || data.answer || 'Sorry, I could not process your request.';
        }
      } else if (selectedTool === 'embed' || selectedTool === 'nerp') {
        // embed 또는 nerp 응답 처리
        if (withAnswer && data.answer) {
          // with_answer=true일 때는 AI 답변만 표시
          responseText = data.answer;
        } else if (data.evidence && data.evidence.length > 0) {
          // with_answer=false일 때는 검색 결과 표시
          responseText = `🔍 검색 결과 (${data.evidence.length}개):\n\n`;
          data.evidence.forEach((item, index) => {
            responseText += `**${item.rank}.** ${item.snippet || '내용 없음'}\n`;
            responseText += `   📊 유사도: ${(item.score * 100).toFixed(1)}%\n`;
            if (item.source_label) {
              responseText += `   📁 출처: ${item.source_label}\n`;
            }
            responseText += '\n';
          });
        } else {
          responseText = '❌ 검색 결과가 없습니다. 다른 키워드로 시도해보세요.';
        }
      } else {
        // gitagent 응답 처리
        if (withAnswer && data.answer) {
          responseText = data.answer;
        } else if (data.evidence && data.evidence.length > 0) {
          responseText = `🔍 검색 결과 (${data.evidence.length}개):\n\n`;
          data.evidence.forEach((item, index) => {
            responseText += `**${item.rank}.** ${item.snippet || '내용 없음'}\n`;
            responseText += `   📊 유사도: ${(item.score * 100).toFixed(1)}%\n`;
            if (item.source_label) {
              responseText += `   📁 출처: ${item.source_label}\n`;
            }
            responseText += '\n';
          });
        } else {
          responseText = '❌ 검색 결과가 없습니다. 다른 키워드로 시도해보세요.';
        }
      }
      
      // 동적 메시지 애니메이션 중지
      stopThinkingAnimation();

      // "생각 중입니다" 메시지 제거하고 실제 응답 추가
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        responseTime: timeTaken,
        evidence: data.evidence || [], // evidence 정보 저장
      };
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        return [...filteredMessages, botResponse];
      });
      
      // 생각 중 메시지를 실제 응답으로 교체
      await updateMessageInSession(thinkingMessage.id, botResponse, sessionId);
      
      // 첫 번째 사용자 메시지인 경우 제목 자동 생성
      if (messages.length === 1) { // 환영 메시지만 있는 상태에서 첫 사용자 메시지
        const autoTitle = generateAutoTitle(currentInput);
        await updateSessionTitle(sessionId, autoTitle);
      }
    } catch (error) {
      console.error('Error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // 동적 메시지 애니메이션 중지
      stopThinkingAnimation();
      
      // "생각 중입니다" 메시지 제거하고 에러 메시지 추가
      let errorMessage = `에러가 발생했습니다: ${error.message}`;
      
      // 응답이 있지만 JSON 파싱 실패한 경우
      if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
        errorMessage = '서버 응답 형식 오류가 발생했습니다. 서버 로그를 확인해주세요.';
      }
      
      const errorResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `${errorMessage} 서버가 실행 중인지 확인해주세요.`,
      };
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        return [...filteredMessages, errorResponse];
      });
      
      // 생각 중 메시지를 에러 응답으로 교체
      await updateMessageInSession(thinkingMessage.id, errorResponse, sessionId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes thinking-dots {
            0%, 20% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            80%, 100% {
              opacity: 0;
            }
          }
          .thinking-dot-1 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0s;
          }
          .thinking-dot-2 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0.2s;
          }
          .thinking-dot-3 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0.4s;
          }
        `
      }} />
      <div className="bg-transparent min-h-screen p-4 sm:p-6 lg:p-8">
        <PageHeader title="AI LLM" />

      <div className="flex flex-col md:flex-row min-h-[calc(100dvh-160px)] bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
        {/* Left Panel: Chat Sessions */}
        <aside className="w-full md:w-1/3 md:max-w-sm bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-200/80 flex flex-col">
          <div className="p-4 border-b border-gray-200/80">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={createNewSession}
                disabled={isCreatingSession}
                className="flex items-center gap-2 text-sm bg-[#3B86F6] text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span className="hidden md:inline">
                  {isCreatingSession ? 'Creating...' : 'New Chat'}
                </span>
              </button>
              <button 
                onClick={cleanDatabase}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-300"
              >
                정리
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B86F6]"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto max-h-72 md:max-h-none">
            {chatSessions.filter(session => 
              session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              <ul className="p-2 space-y-1">
                {chatSessions
                  .filter(session => 
                    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((session) => (
                  <li
                    key={session._id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors relative ${
                      currentSessionId === session._id ? 'bg-gray-200/50' : 'hover:bg-gray-200/50'
                    }`}
                    onClick={() => selectSession(session._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Bot className={`mt-1 flex-shrink-0 ${
                        currentSessionId === session._id ? 'text-gray-600' : 'text-gray-400'
                      }`} size={20} />
                      <div className="flex-grow overflow-hidden">
                        {editingSessionId === session._id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => updateSessionTitle(session._id, editingTitle)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSessionTitle(session._id, editingTitle);
                              } else if (e.key === 'Escape') {
                                setEditingSessionId(null);
                                setEditingTitle('');
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none font-semibold text-sm text-gray-800"
                            autoFocus
                          />
                        ) : (
                          <div className="w-full">
                            {/* 제목, 날짜, 편집/삭제 버튼이 같은 줄에 */}
                            <div className="flex items-center justify-between gap-2">
                              {/* 제목 */}
                              <h3 className={`font-semibold text-sm truncate flex-1 ${
                                currentSessionId === session._id ? 'text-blue-700' : 'text-gray-800'
                              }`}>{session.title}</h3>
                              
                              {/* 날짜 */}
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </span>
                              
                              {/* 편집/삭제 버튼 */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session._id);
                                    setEditingTitle(session.title);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="편집"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(session._id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1 truncate">{session.lastMessage}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Bot className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm">
                  {searchQuery ? '검색 결과가 없습니다' : '새로운 대화를 시작해보세요'}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: Chat Interface */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200/80">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-gray-800">AI Assistant</h2>
                <p className="text-sm text-gray-500">
                  {selectedTool === 'chatbot' ? '탄소배출량 모드' : selectedTool === 'embed' ? 'RAG 검색 모드' : selectedTool === 'gitagent' ? 'Git Agent 모드' : '세금계산서 발행 모드'}
                </p>
              </div>
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <FileUp size={16} />
                  {selectedTool === 'chatbot' ? '탄소배출량 모드' : selectedTool === 'embed' ? 'RAG 검색 모드' : selectedTool === 'gitagent' ? 'Git Agent 모드' : '세금계산서 발행 모드'}
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div
                        onClick={() => {
                          setSelectedTool('chatbot');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'chatbot'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bot className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm"> 탄소배출량 산정</h4>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        onClick={() => {
                          setSelectedTool('embed');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'embed'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Search className="text-green-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">RAG 검색</h4>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        onClick={() => {
                          setSelectedTool('gitagent');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'gitagent'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="text-purple-600" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">Git Agent</h4>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        onClick={() => {
                          setSelectedTool('nerp');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'nerp'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="text-orange-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">세금계산서 발행</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(selectedTool === 'embed' || selectedTool === 'gitagent' || selectedTool === 'nerp') && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={withAnswer}
                            onChange={(e) => setWithAnswer(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          AI 답변 생성 (권장)
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedTool === 'gitagent' 
                            ? (withAnswer 
                                ? "GitHub 소스코드를 분석하여 AI가 최종 답변을 생성합니다" 
                                : "검색된 소스코드 목록만 표시합니다")
                            : selectedTool === 'nerp'
                            ? (withAnswer 
                                ? "세금계산서 발행 정보를 바탕으로 AI가 최종 답변을 생성합니다" 
                                : "검색 결과 목록만 표시합니다")
                            : (withAnswer 
                                ? "검색된 문서를 바탕으로 AI가 최종 답변을 생성합니다" 
                                : "검색 결과 목록만 표시합니다")
                          }
                        </p>
                      </div>
                    )}
                    
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-gray-50">
            {messages.length > 0 ? (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-[#3B86F6] text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className={`${
                      msg.sender === 'user' 
                        ? 'max-w-[85%] sm:max-w-xl' 
                        : selectedTool === 'nerp' 
                          ? 'max-w-[98%] sm:max-w-6xl' 
                          : 'max-w-[85%] sm:max-w-xl'
                    } p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#3B86F6] to-blue-600 text-white rounded-br-none' : 'bg-white shadow-sm border border-gray-200/80 text-gray-800 rounded-bl-none'}`}>
                      {msg.isThinking ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">{thinkingMessages[currentThinkingMessage]}</span>
                          <div className="flex items-center">
                            <span className="thinking-dot-1 text-gray-600">.</span>
                            <span className="thinking-dot-2 text-gray-600">.</span>
                            <span className="thinking-dot-3 text-gray-600">.</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.image && (
                            <div className="mb-2 rounded-lg overflow-hidden">
                              <img 
                                src={msg.image} 
                                alt="Uploaded" 
                                className="max-w-full h-auto max-h-48 object-contain rounded"
                              />
                            </div>
                          )}
                          {msg.sender === 'bot' && selectedTool === 'nerp' 
                            ? renderMessageText(msg.text, true, msg.evidence)
                            : renderMessageText(msg.text, false, msg.evidence)
                          }
                        </>
                      )}
                      {msg.responseTime && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{msg.responseTime}초</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Bot className="mx-auto mb-4 text-gray-300" size={48} />
                  <h3 className="text-lg font-medium mb-2">AI 어시스턴트에 오신 것을 환영합니다!</h3>
                  <p className="text-sm mb-4">챗봇 모드나 RAG 검색 모드를 선택하고 질문을 입력해보세요.</p>
                  <div className="flex gap-2 justify-center">

                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-4 border-t border-gray-200/80 bg-white">
            {/* 이미지 미리보기 (탄소배출량 모드일 때만) */}
            {selectedTool === 'chatbot' && imagePreview && (
              <div className="mb-3 relative inline-block">
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-xs h-auto max-h-32 object-contain rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                {isExtractingImage && (
                  <div className="mt-2 text-xs text-gray-500">이미지에서 텍스트 추출 중...</div>
                )}
                {extractedImageData && (
                  <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded space-y-1">
                    {extractedImageData.productName && (
                      <div>제품명: <span className="font-semibold">{extractedImageData.productName}</span></div>
                    )}
                    {extractedImageData.manufacturer && (
                      <div>제조사: <span className="font-semibold">{extractedImageData.manufacturer}</span></div>
                    )}
                    {extractedImageData.size && (
                      <div>사이즈 또는 규격: <span className="font-semibold">{extractedImageData.size}</span></div>
                    )}
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSend} className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "AI is thinking..." : selectedTool === 'chatbot' ? "이미지를 업로드하거나 메시지를 입력하세요..." : "Type your message here..."}
                className="w-full resize-none border border-gray-300 rounded-lg py-3 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-[#3B86F6] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={1}
                disabled={isLoading || isExtractingImage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isExtractingImage) {
                    handleSend(e);
                  }
                }}
              />
              <div className="absolute left-3 flex items-center">
                {selectedTool === 'chatbot' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={isLoading || isExtractingImage}
                    />
                    <label 
                      htmlFor="image-upload"
                      className={`text-gray-400 hover:text-[#3B86F6] p-2 cursor-pointer ${isLoading || isExtractingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="이미지 업로드"
                    >
                      <Paperclip size={20} />
                    </label>
                  </>
                )}
              </div>
              <div className="absolute right-3 flex items-center">
                <button 
                  type="submit" 
                  disabled={(!input.trim() && !selectedImage) || isLoading || isExtractingImage}
                  className={`p-2 rounded-full transition-colors ${
                    (input.trim() || selectedImage) && !isLoading && !isExtractingImage
                      ? 'bg-[#3B86F6] text-white hover:bg-blue-600 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading || isExtractingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <SendHorizontal size={20} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      </div>
    </>
  );
}

export default withAuth(AiLlmPage);
  