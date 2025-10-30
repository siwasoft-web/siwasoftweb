'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, X, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';

// External API base no longer used; we fetch from our internal API

function RpaPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState('updated_desc');

  // 프로젝트 정렬
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortOption) {
      case 'name_asc':
        return (a.PROJECT_TITLE || '').localeCompare(b.PROJECT_TITLE || '');
      case 'name_desc':
        return (b.PROJECT_TITLE || '').localeCompare(a.PROJECT_TITLE || '');
      case 'updated_asc':
        return new Date(a.updated_at) - new Date(b.updated_at);
      case 'updated_desc':
      default:
        return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });

  // project_code 리스트 가져오기 (로그인한 유저 이메일 기준)
  const fetchProjects = async () => {
    try {
      const userEmail = session?.user?.email;
      if (!userEmail) return;

      const res = await fetch('/api/rpa/projects-by-user');

      if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);
      const json = await res.json();
      setProjects(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchProjects();
    }
  }, [session]);

  // 프로젝트 삭제
  const handleDeleteProject = async (projectCode) => {
  if (!confirm(`프로젝트 코드 ${projectCode}를 삭제하시겠습니까?`)) return;

  try {
      // 삭제 로직은 외부 API 연동 시에만 동작했습니다.
      // 내부 DB에 맞춘 삭제 엔드포인트가 준비되면 아래를 교체하세요.
      alert('삭제 기능은 아직 내부 DB 엔드포인트와 연동되지 않았습니다.');
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  // 로딩/에러 처리
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        데이터 불러오는 중...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        데이터 로드 실패: {error}
      </div>
    );

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="RPA Analyst" />

      <div className="flex justify-between items-center mb-6">
        {/* 정렬 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            정렬:{" "}
            {sortOption === 'name_asc'
              ? '이름 오름차순'
              : sortOption === 'name_desc'
              ? '이름 내림차순'
              : sortOption === 'updated_asc'
              ? '업데이트 오래된 순'
              : '업데이트 최신순'}
            <ChevronDown size={16} />
          </button>

          {showSortMenu && (
            <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg text-sm w-44">
              {[
                { key: 'name_asc', label: '이름 오름차순' },
                { key: 'name_desc', label: '이름 내림차순' },
                { key: 'updated_desc', label: '업데이트 최신순' },
                { key: 'updated_asc', label: '업데이트 오래된 순' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setSortOption(opt.key);
                    setShowSortMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 프로젝트 카드 목록 */}
      <main>
        {sortedProjects.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[40vh] text-gray-400">
            <Layers size={48} className="mb-3 opacity-40" />
            <p className="text-lg font-medium">표시할 프로젝트가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">관리자(Admin) 페이지에서 프로젝트를 생성하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {sortedProjects.map((project) => (
              <Card
                key={project.PROJECT_CODE}
                className="h-full flex flex-col justify-between relative border-l-4 border-[#3B86F6] p-5 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {/* 삭제 */}
                <button
                  onClick={() => handleDeleteProject(project.PROJECT_CODE)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 z-10"
                >
                  <X size={16} />
                </button>

                {/* 링크 이동 */}
                <Link href={`/rpa/${project.PROJECT_CODE}`}>
                  <div className="h-25">
                    <p className="text-sm text-gray-500 mb-1">
                      {project.updated_date || '---'}
                    </p>
                    <h3 className="text-lg font-bold text-blue-600 truncate">
                      {project.PROJECT_TITLE || '이름 없음'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {project.SITE_NAME || 'SITE 정보 없음'}
                    </p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuth(RpaPage);
