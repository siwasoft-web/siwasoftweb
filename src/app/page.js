'use client';

import React from 'react';
import Card from '../components/ui/Card';
import { Layers, MessageSquare, ScanText, User, HelpCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Home() {
  return (
    <div className="p-8">
      <PageHeader title="HOME" />

      <main>
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-[#3B86F6]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">2030</p>
                  <h3 className="text-xl font-semibold text-gray-800 mt-1">프로젝트 A</h3>
                </div>
                <Layers className="text-gray-400" />
              </div>
              <p className="text-gray-600 mt-4">기업 정보를 확인하신 후, 다음 단계로 넘어 가주세요.</p>
              <a href="#" className="text-blue-600 font-medium mt-6 inline-block">자세히 보기 →</a>
            </Card>
            <Card className="border-l-4 border-[#3B86F6]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">2030</p>
                  <h3 className="text-xl font-semibold text-gray-800 mt-1">프로젝트 A</h3>
                </div>
                <Layers className="text-gray-400" />
              </div>
              <p className="text-gray-600 mt-4">기업 정보를 확인하신 후, 다음 단계로 넘어 가주세요.</p>
              <a href="#" className="text-blue-600 font-medium mt-6 inline-block">자세히 보기 →</a>
            </Card>
            <Card className="border-l-4 border-[#3B86F6]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">2030</p>
                  <h3 className="text-xl font-semibold text-gray-800 mt-1">프로젝트 A</h3>
                </div>
                <Layers className="text-gray-400" />
              </div>
              <p className="text-gray-600 mt-4">기업 정보를 확인하신 후, 다음 단계로 넘어 가주세요.</p>
              <a href="#" className="text-blue-600 font-medium mt-6 inline-block">자세히 보기 →</a>
            </Card>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">AI 기반 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MessageSquare className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">AI-LLM 대화방</h3>
                  <p className="text-gray-600 mt-1">자연어 처리 기반의 AI와 대화하고 업무 관련 도움을 받으세요.</p>
                </div>
              </div>
              <a href="#" className="text-blue-600 font-medium mt-4 inline-block">대화방 시작하기 →</a>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <ScanText className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">AI-OCR 문서 목록</h3>
                  <p className="text-gray-600 mt-1">문서 이미지를 업로드하고 텍스트를 자동으로 추출하세요.</p>
                </div>
              </div>
              <a href="#" className="text-blue-600 font-medium mt-4 inline-block">문서 목록 보기 →</a>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">계정 및 지원</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <User className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">계정 정보</h3>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <HelpCircle className="text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">질문/답변</h3>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
