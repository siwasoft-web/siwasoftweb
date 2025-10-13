'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { BarChart2, Zap, Bot, ScanSearch, HelpCircle, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Image from 'next/image';
import siwasoftCi from '@/assets/siwasoft_ci.png';
import { useSession, signOut } from 'next-auth/react';

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/', icon: BarChart2, label: 'HOME' },
    { href: '/rpa', icon: Zap, label: 'RPA' },
    { href: '/aillm', icon: Bot, label: 'AI LLM' },
    { href: '/aiocr', icon: ScanSearch, label: 'AI OCR' },
    { href: '/inquiry', icon: HelpCircle, label: 'INQUIRY' },
    { href: '/setting', icon: Settings, label: 'SETTING' },
  ];

  return (
    <div className={`flex flex-col bg-white h-100% min-h-screen p-4 shadow-xl transition-all duration-300 ${isOpen ? 'w-64 min-w-64' : 'w-20 min-w-20'}`}>
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-10`}>
        {isOpen && <Image src={siwasoftCi} alt="Siwasoft Logo" width={120} height={34} />}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-md hover:bg-gray-100 cursor-pointer">
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
      <div className="mt-auto">
        {session && (
          <div
            onClick={() => signOut({ 
              callbackUrl: '/auth/signin',
              redirect: true 
            })}
            className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors bg-red-50 text-red-600 hover:bg-red-100`}
          >
            <LogOut size={20} />
            <span className={`${!isOpen && 'hidden'}`}>Logout</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
