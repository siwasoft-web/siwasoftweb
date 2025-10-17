'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, X, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://192.168.0.222:8010';

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

  // 프로젝트 정렬기능
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortOption) {
      case 'name_asc':
        return (a.site_name || '').localeCompare(b.site_name || '');
      case 'name_desc':
        return (b.site_name || '').localeCompare(a.site_name || '');
      case 'updated_asc':
        return new Date(a.updated_at) - new Date(b.updated_at);
      case 'updated_desc':
      default:
        return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });
  // mongoDB에서 사이트 리스트를 받아옴
  const fetchProjects = async () => {
    try {
      const userEmail = session?.user?.email;
        if (!userEmail) {
          console.warn('로그인된 사용자 이메일을 찾을 수 없습니다.');
          return;
        }

      const res = await fetch(`${API_BASE}/api/v1/rpa/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail, // ✅ 사용자 ID 전달
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

  //사이트 추가
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
          'x-user-id': userEmail, // 로그인 사용자 이메일 전달
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || '사이트 생성 실패');

      const siteLabel = data.SITE_NAME || data.RETURN_ID;
      alert(`${siteLabel} 등록 성공!`);
      setIsModalOpen(false);
      setNewSiteCode('');
      setNewUserInfo('');
      fetchProjects();
    } catch (err) {
      alert(`등록 실패: ${err.message}`);
    }
  };

  //프로젝트 삭제
  const handleDeleteProject = async (siteCode) => {
    if (!confirm(`해당 사이트를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/rpa/delete/${siteCode}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      console.log('DELETE Response:', data);

      if (!res.ok) throw new Error(data.detail || '삭제 실패');

      const siteLabel = data.SITE_NAME || data.RETURN_ID || siteCode;
      alert(`${siteLabel} 삭제 완료!`);

      fetchProjects();
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  // 각 사이트 프로젝트 마다 접속권자 변경 기능 관련 추가
  const openUserModal = (project) => {
    setSelectedProject(project);
    setIsUserModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // 공통 사용자 갱신 함수 (모달 내부에서도 최신 USER_INFO 즉시 반영)
  const refreshProjectUsers = async (siteCode) => {
    const res = await fetch(`${API_BASE}/api/v1/rpa/list`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': session?.user?.email || ''
      },
    });
    const data = await res.json();
    const updated = data.data.find((p) => p.SITE_CODE === siteCode);

    if (updated) {
      // ✅ 모달 내부 최신 반영
      setSelectedProject(updated);

      // ✅ 부모 상태(projects)도 최신 반영
      setProjects((prev) =>
        prev.map((proj) =>
          proj.SITE_CODE === siteCode ? updated : proj
        )
      );
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail) return alert('이메일을 입력해주세요.');
    if (selectedProject.USER_INFO?.includes(newUserEmail)) {
      alert('이미 등록된 사용자입니다.');
      return;
    }

    setIsUpdating(true);
    try {
      await fetch(`${API_BASE}/api/v1/rpa/user/update/${selectedProject.SITE_CODE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add: [newUserEmail] }),
      });
      alert('사용자 추가 완료!');
      setNewUserEmail('');
      await refreshProjectUsers(selectedProject.SITE_CODE); // 새 데이터 반영
    } catch (err) {
      alert('사용자 추가 실패: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (email) => {
    if (!confirm(`${email} 사용자를 삭제하시겠습니까?`)) return;
    setIsUpdating(true);
    try {
      await fetch(`${API_BASE}/api/v1/rpa/user/update/${selectedProject.SITE_CODE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove: [email] }),
      });
      alert('삭제 완료!');
      await refreshProjectUsers(selectedProject.SITE_CODE); // 새 데이터 반영
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // 로링 구현
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
          {/* 정렬 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              정렬: {sortOption === 'name_asc' ? '이름 오름차순'
                    : sortOption === 'name_desc' ? '이름 내림차순'
                    : sortOption === 'updated_asc' ? '업데이트 오래된 순'
                    : '업데이트 최신순'}
              <ChevronDown size={16} />
            </button>

            {showSortMenu && (
              <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg text-sm w-44">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setSortOption('name_asc'); setShowSortMenu(false); }}>
                  이름 오름차순
                </button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setSortOption('name_desc'); setShowSortMenu(false); }}>
                  이름 내림차순
                </button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setSortOption('updated_desc'); setShowSortMenu(false); }}>
                  업데이트 최신순
                </button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => { setSortOption('updated_asc'); setShowSortMenu(false); }}>
                  업데이트 오래된 순
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3b83f6] hover:bg-[#155efcdc] transition-colors text-white rounded-full px-4 py-2 text-sm font-semibold"
        >
          <Plus size={16} />
          프로젝트 생성
        </button>
      </div>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {sortedProjects.map((project) => (
            <Card
              key={project.SITE_CODE}
              className="h-full flex flex-col justify-between relative border-l-4 border-[#3B86F6] p-5 cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* 삭제 버튼 */}
              <button
                onClick={() => handleDeleteProject(project.SITE_CODE)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 z-10"
              >
                <X size={16} />
              </button>

              <Link href={`/rpa/${project.SITE_CODE}`}>
                <div className="h-25">
                  <p className="text-sm text-gray-500 mb-1">{project.updated_date || '---'}</p>
                  <h3 className="text-lg font-bold text-blue-600 truncate">
                    {project.site_name || '이름 없음'}
                  </h3>
                </div>
              </Link>
              <div className="mt-4 flex items-center gap-2 text-gray-400">
                <Layers className="cursor-pointer hover:text-blue-500"
                  onClick={() => openUserModal(project)}
                />
                <span className="text-sm text-gray-600">
                  {project.USER_INFO?.length || 0}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* 프로젝트 생성 모달 */}
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

      {/* 접속권한자 수정 모달 */}
      {isUserModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedProject.site_name} 접근 계정
              </h2>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="닫기"
              >
                ✕
              </button>
            </div>

            <ul className="max-h-40 overflow-y-auto border p-2 rounded-md mb-3">
              {selectedProject.USER_INFO?.map((email) => (
                <li key={email} className="flex justify-between items-center py-1 text-sm">
                  <span>{email}</span>
                  <button
                    onClick={() => handleRemoveUser(email)}
                    className={`text-xs ${
                      email === session?.user?.email
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    disabled={isUpdating || email === session?.user?.email}
                    title={
                      email === session?.user?.email
                        ? '자기 자신은 삭제할 수 없습니다.'
                        : '삭제'
                    }
                  >
                    삭제
                  </button>
                </li>
              ))}
              {selectedProject.USER_INFO?.length === 0 && (
                <li className="text-gray-400 text-sm text-center py-2">
                  접속 가능한 유저 없음
                </li>
              )}
            </ul>

            <div className="flex gap-2">
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="추가할 이메일 입력"
                className="border rounded-md px-2 py-1 flex-1 text-sm"
                disabled={isUpdating}
              />
              <button
                onClick={handleAddUser}
                className="bg-blue-600 text-white rounded-md px-3 py-1 text-sm hover:bg-blue-700 disabled:bg-gray-300"
                disabled={isUpdating}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(RpaPage);
  