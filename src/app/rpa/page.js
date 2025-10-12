'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, X, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';

const projects = [
  {
    id: 'project-a',
    year: '2030-01-01',
    title: '프로젝트 A',
    description: '기업 정보를 확인하신 후, 다음 단계로 넘어가 주세요.',
  },
  {
    id: 'project-b',
    year: '2024',
    title: '프로젝트 BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    description: '가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하'
  },
  {
    id: 'project-c',
    year: '2023',
    title: '프로젝트 C',
  },
  {
    id: 'project-d',
    year: '2022',
    title: '프로젝트 D',
  },
  {
    id: 'project-e',
    year: '2021',
    title: '프로젝트 E',
  },
];

function RpaPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="RPA Analyst" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            전체 <ChevronDown size={16} />
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            정렬: 등록일 <ChevronDown size={16} />
          </button>
        </div>
        <button className="flex items-center gap-2 bg-[#3b83f6] hover:bg-[#155efcdc] transition-colors cursor-pointer text-white rounded-full px-4 py-2 text-sm font-semibold ">
          <Plus size={16} />
          프로젝트 생성
        </button>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {projects.map((project) => (
            <Link href={`/rpa/${project.id}`} key={project.id}>
              <Card className="h-full flex flex-col justify-between relative border-l-4 border-[#3B86F6] p-5 cursor-pointer hover:shadow-lg transition-shadow">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // 여기에 삭제 로직 추가
                    //console.log(`Delete ${project.title}`);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X size={16} />
                </button>
                <div className='h-25'>
                  <p className="text-sm text-gray-500 mb-1">{project.year}</p>
                  <h3 className="text-lg font-bold text-blue-600 truncate">{project.title}</h3>
                  {project.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <div className="mt-4">
                  <Layers className="text-gray-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(RpaPage);
  