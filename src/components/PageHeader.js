'use client';

import React from 'react';
import { Mail, Bell } from 'lucide-react';

const PageHeader = ({ title }) => {
  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#155efcdc]">{title}</h1>
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
            <Mail size={18} />
            문의하기
          </a>
          <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
            <Bell size={18} />
            알림 0
          </a>
        </div>
      </header>
      <div className="border-t border-gray-200 mb-6"></div>
    </>
  );
};

export default PageHeader;
