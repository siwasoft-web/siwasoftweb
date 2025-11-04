'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Circle, ArrowLeft, Layers } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';

// const API_BASE = process.env.NEXT_PUBLIC_RPA_API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8010';

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
                onClick={() => handleLogClick(log)}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col cursor-pointer hover:shadow-md transition-all ${
                  selectedLog?.TITLE === log.TITLE ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="p-5 flex-grow">
                  <h3 className="text-lg font-bold text-blue-600 truncate">{log.TITLE}</h3>
                  <div className="my-3">
                    <StatusBadge name={statusName} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">업데이트:</span>{' '}
                    {ts ? new Date(ts).toLocaleString('ko-KR') : '---'}
                  </p>
                </div>

                <div className="bg-[#6b7280] text-white text-center text-xs py-2 rounded-b-lg">
                  START
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 로그 상세 출력 섹션 */}
      {selectedLog && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {selectedLog?.TITLE || 'RPA'} 로그
          </h2>
          <div className="space-y-3">
            {selectedLog.LOG
              ? selectedLog.LOG.split('\n')
                  .filter((line) => line.trim() !== '')
                  .map((line, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {line}
                    </div>
                  ))
              : (
                <div className="text-gray-400 text-sm">
                  로그 데이터가 없습니다.
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
