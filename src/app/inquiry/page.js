'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { ChevronDown, FileText, Download, Megaphone } from 'lucide-react';
import withAuth from '@/components/withAuth';

// Mock Data
const faqs = [
  {
    question: 'RPA 프로젝트는 어떻게 생성하나요?',
    answer: 'RPA Analyst 페이지 우측 상단에 있는 "+ 프로젝트 생성" 버튼을 클릭하여 새로운 RPA 프로젝트를 시작할 수 있습니다. 필요한 정보를 입력하고 템플릿을 선택하면 프로젝트가 생성됩니다.',
  },

];

const manuals = [
  {
    title: 'RPA Analyst 사용자 매뉴얼',
    version: 'v2.1.0',
    description: 'RPA 프로젝트 생성부터 관리, 배포까지 전 과정을 다루는 공식 사용자 매뉴얼입니다.',
    fileType: 'PDF',
    size: '5.4 MB',
  },

];

const notices = [
  {
    title: '시스템 정기 점검 안내 (11/28 02:00 ~ 04:00)',
    date: '2025-11-25',
  },
  {
    title: 'AI OCR 인식률 개선 업데이트 안내',
    date: '2025-11-20',
  },
  {
    title: 'v2.1.0 릴리즈 노트: 신규 기능 추가 및 개선 사항',
    date: '2025-11-15',
  },
  {
    title: '서버 인프라 교체에 따른 서비스 일시 중단 안내',
    date: '2025-11-10',
  },
];


function InquiryPage() {
  const [activeTab, setActiveTab] = useState('faq');
  const [openFaq, setOpenFaq] = useState(0);

  const renderContent = () => {
    switch (activeTab) {
      case 'faq':
        return (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex justify-between items-center p-5 text-left font-semibold text-gray-800 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="p-5 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'manuals':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {manuals.map((manual, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="text-[#3B86F6]" />
                    <h3 className="text-lg font-bold text-gray-800">{manual.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{manual.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200/80">
                  <span>Version {manual.version} ({manual.size})</span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'notices':
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <ul className="divide-y divide-gray-200">
                    {notices.map((notice, index) => (
                        <li key={index} className="p-5 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Megaphone size={20} className="text-gray-400" />
                                <span className="font-semibold text-gray-800">{notice.title}</span>
                            </div>
                            <span className="text-sm text-gray-500">{notice.date}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-semibold cursor-pointer rounded-t-lg transition-colors 
        ${activeTab === id 
          ? 'bg-transparent border-b-2 border-[#3B86F6] text-blue-600' 
          : 'text-gray-500 hover:text-gray-800'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="INQUIRY" />
      
      <div className="max-w-5xl mx-auto">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-2">
            <TabButton id="faq" label="자주 묻는 질문 (FAQ)" />
            <TabButton id="manuals" label="매뉴얼" />
            <TabButton id="notices" label="공지사항" />
          </nav>
        </div>
        
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default withAuth(InquiryPage);
  