'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Zap, BrainCircuit, ScanSearch, HelpCircle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: BarChart2, label: 'HOME' },
    { href: '/rpa', icon: Zap, label: 'RPA' },
    { href: '/aillm', icon: BrainCircuit, label: 'AI LLM' },
    { href: '/aiocr', icon: ScanSearch, label: 'AI OCR' },
    { href: '/inquiry', icon: HelpCircle, label: 'INQUIRY' },
    { href: '/setting', icon: Settings, label: 'SETTING' },
  ];

  return (
    <div className={`flex flex-col bg-white h-screen p-4 border-r border-gray-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between mb-10">
        <h1 className={`text-2xl font-bold text-blue-600 ${!isOpen && 'hidden'}`}>로고</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-md hover:bg-gray-100">
          {isOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href}>
                <div className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <item.icon size={20} />
                  <span className={`${!isOpen && 'hidden'}`}>{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
