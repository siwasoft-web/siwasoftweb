'use client';

import React, { useState } from 'react';
import { Mail, Bell, X } from 'lucide-react';
import Image from 'next/image';
import logo from '@/assets/logo.png';

const PageHeader = ({ title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#155efcdc]">{title}</h1>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <Mail size={18} />
            문의하기
          </button>
          <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
            <Bell size={18} />
            알림 0
          </a>
        </div>
      </header>
      <div className="border-t border-gray-200 mb-6"></div>

      {/* Carbonomy 문의 모달 */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>

            {/* 로고 */}
            <div className="flex justify-center mb-6">
              <Image 
                src={logo} 
                alt="Carbonomy Logo" 
                width={64} 
                height={64}
                className="object-contain"
              />
            </div>

            {/* 타이틀 */}
            <h2 className="text-3xl font-bold text-white text-center mb-6">Siwasoft</h2>

            {/* 메인 메시지 */}
            <p className="text-white text-center mb-8 text-sm">
              제품 관련 상담은 아래로 연락 부탁드립니다.
            </p>

            {/* 연락처 정보 */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <p className="text-sm">Email : sales@siwasoft.co.kr</p>
                </div>
                <div className="text-white text-right mr-4">
                  <p className="text-sm">T : 02-6332-0111</p>
                </div>
              </div>
            </div>

            {/* 회사 정보 */}
            <p className="text-white text-center text-xs mb-6">
              WorkBuilder for AI is a product of Siwasoft.
            </p>

            {/* 저작권 및 주소 */}
            <div className="border-t border-gray-700 pt-6 text-center">
              <p className="text-gray-400 text-xs mb-2">
                ©  This content is owned by Siwasoft
              </p>
              <p className="text-gray-400 text-xs">
                서울 금천구 가산디지털1로5 대륭테크노20차 912호
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PageHeader;
