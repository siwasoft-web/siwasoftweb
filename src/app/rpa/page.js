'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, X, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';

// const projects = [
//   {
//     id: 'project-a',
//     year: '2030-01-01',
//     title: '프로젝트 A',
//     description: '기업 정보를 확인하신 후, 다음 단계로 넘어가 주세요.',
//   },
//   {
//     id: 'project-b',
//     year: '2024',
//     title: '프로젝트 BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
//     description: '가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사아자차카타파하'
//   },
//   {
//     id: 'project-c',
//     year: '2023',
//     title: '프로젝트 C',
//   },
//   {
//     id: 'project-d',
//     year: '2022',
//     title: '프로젝트 D',
//   },
//   {
//     id: 'project-e',
//     year: '2021',
//     title: '프로젝트 E',
//   },
// ];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://192.168.0.222:8010';

function RpaPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/rpa/list`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);

        const json = await res.json();
        // FastAPI에서 {"data": [...]} 형태로 오므로 data.data 사용
        setProjects(json.data || []);
      } catch (err) {
        console.error('❌ RPA 데이터 로드 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        데이터 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        데이터 로드 실패: {error}
      </div>
    );
  }

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
            <Link href={`/rpa/${project.SITE_CODE}`} key={project.SITE_CODE}>
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
  