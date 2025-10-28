'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, X, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://221.139.227.131:8010';

function RpaPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSiteCode, setNewSiteCode] = useState('');
  const [newUserInfo, setNewUserInfo] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState('updated_desc');

  // ✅ 프로젝트 정렬
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

  // ✅ project_code 리스트 가져오기
  const fetchProjects = async () => {
    try {
      const userEmail = session?.user?.email;
      if (!userEmail) return;

      const res = await fetch(`${API_BASE}/api/v1/rpa/project/list`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail,
        },
      });

      if (!res.ok) throw new Error(`서버 응답 오류 (${res.status})`);
      const json = await res.json();
      setProjects(json.data || []);
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

  // ✅ 프로젝트 생성
  const handleCreateProject = async () => {
    if (!newSiteCode) {
      alert('SITE_CODE를 입력해주세요.');
      return;
    }

    try {
      const userEmail = session?.user?.email;
      const payload = {
        SITE_CODE: parseInt(newSiteCode),
        USER_INFO: newUserInfo ? newUserInfo.split(',').map((v) => v.trim()) : [],
      };

      const res = await fetch(`${API_BASE}/api/v1/rpa/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || '사이트 생성 실패');

      alert(`프로젝트 생성 완료: ${data.PROJECT_TITLE}`);
      setIsModalOpen(false);
      setNewSiteCode('');
      setNewUserInfo('');
      fetchProjects();
    } catch (err) {
      alert(`등록 실패: ${err.message}`);
    }
  };

  // ✅ 프로젝트 삭제
  const handleDeleteProject = async (siteCode) => {
    if (!confirm(`SITE_CODE ${siteCode} 사이트를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/rpa/delete/${siteCode}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || '삭제 실패');

      alert(`${data.SITE_NAME || siteCode} 삭제 완료`);
      fetchProjects();
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  // ✅ 권한자 관리 모달
  const openUserModal = (project) => {
    setSelectedProject(project);
    setIsUserModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // ✅ 로딩/에러 처리
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3b83f6] hover:bg-[#155efcdc] transition-colors text-white rounded-full px-4 py-2 text-sm font-semibold"
        >
          <Plus size={16} />
          프로젝트 생성
        </button>
      </div>

      {/* ✅ 프로젝트 카드 목록 */}
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {sortedProjects.map((project) => (
            <Card
              key={project.PROJECT_CODE}
              className="h-full flex flex-col justify-between relative border-l-4 border-[#3B86F6] p-5 cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* 삭제 */}
              <button
                // onClick={() => handleDeleteProject(project.SITE_CODE)}
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

              {/* <div className="mt-4 flex items-center gap-2 text-gray-400">
                <Layers
                  className="cursor-pointer hover:text-blue-500"
                  onClick={() => openUserModal(project)}
                />
                <span className="text-sm text-gray-600">
                  {project.USER_INFO?.length || 0}
                </span>
              </div> */}
            </Card>
          ))}
        </div>
      </main>

      {/* ✅ 프로젝트 생성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-4">새 프로젝트 생성</h2>

            <label className="block text-sm mb-1">SITE_CODE</label>
            <input
              type="text"
              placeholder="예: 6001"
              value={newSiteCode}
              onChange={(e) => setNewSiteCode(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
            />

            <label className="block text-sm mb-1">USER_INFO (쉼표 구분)</label>
            <input
              type="text"
              placeholder="예: user1, user2"
              value={newUserInfo}
              onChange={(e) => setNewUserInfo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => closeModal()}
                className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 text-sm bg-[#3b83f6] text-white rounded-md hover:bg-[#155efcdc]"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(RpaPage);
