'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Mail, Bell, Plus, CheckCircle, XCircle, AlertCircle, Circle } from 'lucide-react';

const dashboardTasks = [
  {
    title: '가용 재고',
    status: '완료',
    stage: '요구 사항 분석 및 디자인 단계',
    dueDate: '2024년 12월 31일',
    action: 'START',
  },
  {
    title: '물류 재고',
    status: '진행중',
    stage: '개발 및 테스트 단계',
    dueDate: '2025년 3월 15일',
    action: 'STOP',
  },
  {
    title: '생산 계획',
    status: '완료',
    stage: '최종 검토 및 배포 준비',
    dueDate: '2024년 11월 30일',
    action: 'START',
  },
  {
    title: '메일링 서비스',
    status: '대기중',
    stage: '시작 대기',
    dueDate: '2024년 11월 30일',
    action: 'START',
  },
  {
    title: 'LLM 데이터 생성',
    status: '오류',
    stage: '데이터 수집 단계에서 오류 발생',
    dueDate: '2024년 10월 31일',
    action: 'START',
  },
];

const notifications = [
  '알림: 프로젝트 A 팀 회의가 오전 10시에 있습니다.',
  '알림: 프로젝트 B의 새로운 작업이 할당되었습니다.',
  '알림: 프로젝트 C의 최종 보고서를 검토해주세요.',
];

const statusStyles = {
  완료: {
    icon: <CheckCircle size={16} className="text-white" />,
    bg: 'bg-blue-500',
    text: 'text-white',
    label: '완료',
  },
  진행중: {
    icon: <div className="w-3 h-3 bg-green-500 rounded-full"></div>,
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: '진행중',
  },
  대기중: {
    icon: <Circle size={12} className="text-gray-500" />,
    bg: 'bg-gray-200',
    text: 'text-gray-700',
    label: '대기중',
  },
  오류: {
    icon: <AlertCircle size={16} className="text-white" />,
    bg: 'bg-red-500',
    text: 'text-white',
    label: '오류',
  },
};

const StatusBadge = ({ status }) => {
  const style = statusStyles[status];
  if (!style) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
};

export default function ProjectDashboardPage() {
  const { projectId } = useParams();

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">RPA Analyst</h1>
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-blue-700">
          <Plus size={16} />
          RPA 생성
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        {dashboardTasks.map((task, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <div className="p-5 flex-grow">
              <h3 className="text-lg font-bold text-blue-600">{task.title}</h3>
              <div className="my-3">
                <StatusBadge status={task.status} />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">진행 중:</span> {task.stage}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">마감일:</span> {task.dueDate}
              </p>
            </div>
            <button className="bg-[#6b7280] font-bold w-full rounded-b-lg hover:bg-gray-300 transition-colors text-[0.75rem] text-white">
              {task.action}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 알림</h2>
        <div className="space-y-4">
          {notifications.map((note, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm text-gray-700">
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
