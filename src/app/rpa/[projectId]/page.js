'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Circle, ArrowLeft, Layers } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';

// 상태 스타일 정의
const statusStylesByName = {
  '대기중': {
    icon: <Circle size={12} className="text-gray-500" />,
    bg: 'bg-gray-200',
    text: 'text-gray-700',
    label: '대기중',
  },
  '실행중': {
    icon: <div className="w-3 h-3 bg-green-500 rounded-full" />,
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: '실행중',
  },
  '오류': {
    icon: <AlertCircle size={16} className="text-white" />,
    bg: 'bg-red-500',
    text: 'text-white',
    label: '오류',
  },
  '성공': {
    icon: <CheckCircle size={16} className="text-white" />,
    bg: 'bg-[#3B86F6]',
    text: 'text-white',
    label: '완료',
  },
};

const StatusBadge = ({ name }) => {
  const style = statusStylesByName[name] || statusStylesByName['대기중'];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
};

const codeToName = {
  1000: '대기중',
  1001: '실행중',
  3001: '오류',
};

export default function ProjectDashboardPage() {
  const { data: session } = useSession();
  const { projectId } = useParams(); // site_code
  const router = useRouter();
  const [rpaLogs, setRpaLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const allLines = selectedLog?.LOG
    ? selectedLog.LOG.split('\n').filter((line) => line.trim() !== '')
    : [];

  const filteredLines = searchTerm
    ? allLines.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : allLines;

  const logsPerPage = 5;
  const totalPages = Math.ceil(filteredLines.length / logsPerPage);
  const startIdx = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLines.slice(startIdx, startIdx + logsPerPage);

  const pageGroupSize = 10; // 한 번에 표시할 페이지 버튼 개수
  const currentGroup = Math.floor((currentPage - 1) / pageGroupSize); // 현재 구간 (0부터 시작)
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  // 프로젝트 이름 가져오기
  const fetchProjectName = async () => {
    try {
      const res = await fetch(`/api/rpa/projects/list`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session?.user?.email || '',
        },
      });
      const data = await res.json();
      const match = data.data.find((p) => String(p.PROJECT_CODE) === String(projectId));
      if (match) setProjectName(match.PROJECT_TITLE || `프로젝트 ${projectId}`);
    } catch (err) {
      console.error('프로젝트명 불러오기 실패:', err);
    }
  };

  // RPA 로그 불러오기
  const fetchRpaLogs = async () => {
    try {
      const res = await fetch(`/api/rpa/rpa_log/list/${projectId}`);
      const data = await res.json();
      const logs = Array.isArray(data) ? data : data.data || [];

      // is_use가 true인 로그만 표시
      const activeLogs = logs.filter((l) => l.is_use !== false);

      setRpaLogs(activeLogs);
      if (activeLogs.length > 0) {
        setSelectedLog(activeLogs[0]);
      }
    } catch (err) {
      console.error('RPA 로그 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectName();
      fetchRpaLogs();
    }
  }, [projectId]);

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setCurrentPage(1); // ④ 페이지 초기화 추가
    setSearchTerm('');
  };

  // 🔹 START 버튼 동작
  const handleStart = async (log) => {
    console.log("START 클릭됨:", log.id, "CMD:", log.CMD, "TYPE:", typeof log.CMD);
    if (!log.CMD || log.CMD.trim() === '') {
      alert('CMD 설정이 안돼있습니다.');
      return;
    }

    if (log.STATUS_CODE !== 1000) {
      alert('현재 상태에서는 실행할 수 없습니다.');
      return;
    }

    try {
      const res = await fetch(`/api/rpa/rpa_log/start/${log.id}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.status === 'started') {
        alert('원격 실행이 시작되었습니다.');
        const updated = rpaLogs.map((l) =>
          l.id === log.id ? { ...l, STATUS_CODE: 1001 } : l
        );
        setRpaLogs(updated);
      } else {
        alert(data.detail || data.message || '실행 실패');
      }
    } catch (err) {
      alert('서버 오류: ' + err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        데이터 불러오는 중...
      </div>
    );

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="RPA Analyst" />

      <div className="flex justify-between items-center mb-6">
        <div className="flex justify-start items-center">
          <button
            onClick={() => router.back()}
            className="mr-2 p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {projectName || `프로젝트 코드 ${projectId}`}
          </h2>
        </div>
      </div>

      {/* RPA 로그 카드 목록 */}
      {rpaLogs.length === 0 ? (
        <div className="flex flex-col justify-center items-center min-h-[40vh] text-gray-400">
          <Layers size={48} className="mb-3 opacity-40" />
          <p className="text-lg font-medium">표시할 로그가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">자동화 실행 후 로그가 생성됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          {rpaLogs.map((log, index) => {
            const statusName = log.status_name || codeToName[log.STATUS_CODE] || '대기중';
            const ts = log.updated_at || log.created_at;

            return (
              <div
                key={index}
                // onClick={() => handleLogClick(log)}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col cursor-pointer hover:shadow-md transition-all ${
                  selectedLog?.TITLE === log.TITLE ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="p-5 flex-grow" onClick={() => handleLogClick(log)}>
                  <h3 className="text-lg font-bold text-blue-600 truncate">{log.TITLE}</h3>
                  <div className="my-3">
                    <StatusBadge name={statusName} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">업데이트:</span>{' '}
                    {ts ? new Date(ts).toLocaleString('ko-KR') : '---'}
                  </p>
                </div>

                {/* ✅ START 버튼은 별도 클릭 이벤트만 */}
                <button
                  onClick={() => handleStart(log)}
                  disabled={log.STATUS_CODE !== 1000}
                  className={`text-xs py-2 rounded-b-lg text-white w-full transition-colors ${
                    log.STATUS_CODE === 1000
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : log.STATUS_CODE === 1001
                      ? 'bg-green-500 cursor-default'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {log.STATUS_CODE === 1000
                    ? 'START'
                    : log.STATUS_CODE === 1001
                    ? '실행중'
                    : '비활성'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 로그 상세 출력 섹션 */}
      {selectedLog && (
        <div className="mt-10">
          {/* 상단 헤더 + 검색 영역 */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedLog?.TITLE || 'RPA'} 로그
            </h2>

            {/* 🔍 검색창 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="로그 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 w-52 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => setSearchTerm('')}
                className="px-2.5 py-1 bg-gray-200 text-sm rounded-lg hover:bg-gray-300"
              >
                초기화
              </button>
            </div>
          </div>

          {(() => {
            return (
              <>
                {/* 로그 출력 */}
                <div className="space-y-3">
                  {currentLogs.length > 0 ? (
                    currentLogs.map((rawLine, idx) => {
                      // ① '|' → 공백 치환
                      const line = rawLine.replace(/\|/g, ' / ');

                      // ② 오류 색상 감지
                      const isError =
                        line.includes('오류') ||
                        line.includes('에러') ||
                        line.toLowerCase().includes('error') ||
                        line.toLowerCase().includes('fail');

                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg shadow-sm p-3 text-sm transition-colors ${
                            isError
                              ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {line}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 text-sm">
                      로그 데이터가 없습니다.
                    </div>
                  )}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                    {/* << 처음으로 */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md border text-sm ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ≪
                    </button>

                    {/* < 이전 */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md border text-sm ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ＜
                    </button>

                    {/* 페이지 번호 (현재 구간) */}
                    {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                      const pageNum = startPage + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm font-medium border ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* > 다음 */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md border text-sm ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ＞
                    </button>

                    {/* >> 마지막으로 */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md border text-sm ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ≫
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
