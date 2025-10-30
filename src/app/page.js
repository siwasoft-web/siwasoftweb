'use client';

import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import { Layers, MessageSquare, ScanText, User, HelpCircle, Clock, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function Home() {
  const { data: session } = useSession();
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [ocrHistory, setOcrHistory] = useState([]);
  const [isLoadingOcrHistory, setIsLoadingOcrHistory] = useState(true);

  // 대화방 목록 가져오기
  useEffect(() => {
    const fetchChatSessions = async () => {
      if (!session) return;
      
      try {
        setIsLoadingSessions(true);
        const response = await fetch('/api/chat-sessions');
        const data = await response.json();
        
        if (data.success) {
          setChatSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchChatSessions();
  }, [session]);

  // OCR 작업 이력 가져오기
  useEffect(() => {
    const fetchOcrHistory = async () => {
      if (!session) return;
      
      try {
        setIsLoadingOcrHistory(true);
        const response = await fetch('/api/ocr-history?limit=5');
        const data = await response.json();
        
        if (data.success) {
          setOcrHistory(data.history || []);
        }
      } catch (error) {
        console.error('Error fetching OCR history:', error);
      } finally {
        setIsLoadingOcrHistory(false);
      }
    };

    fetchOcrHistory();
  }, [session]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
              
              {/* 대화방 목록 섹션 */}
              <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                {isLoadingSessions ? (
                  <div className="text-gray-500 text-sm">대화방 목록을 불러오는 중...</div>
                ) : chatSessions.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">최근 대화방</h4>
                    <div className="space-y-2 h-48 overflow-y-auto">
                      {chatSessions.slice(0, 5).map((session) => (
                        <Link 
                          key={session._id} 
                          href={`/aillm?session=${session._id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {session.title}
                              </p>
                              {session.lastMessage && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {session.lastMessage}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatDate(session.updatedAt)}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                      <Link 
                        href="/aillm" 
                        className="inline-flex items-center justify-center px-4 py-2 text-blue-600 font-medium text-sm hover:text-blue-700 mx-auto"
                        style={{ display: 'block', width: 'max-content' }}
                      >
                        대화방 시작하기 →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <MessageSquare className="text-blue-600" size={32} />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">AI-LLM 대화를 시작해보세요</h4>
                      <p className="text-sm text-gray-500 mb-6">업무 관련 질문을 하고 AI의 도움을 받아보세요</p>
                      <Link 
                        href="/aillm" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageSquare size={20} />
                        대화방 시작하기 →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
              
              {/* OCR 작업 이력 섹션 */}
              <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                {isLoadingOcrHistory ? (
                  <div className="text-gray-500 text-sm">작업 이력을 불러오는 중...</div>
                ) : ocrHistory.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">최근 OCR 작업</h4>
                    <div className="space-y-2 h-48 overflow-y-auto">
                      {ocrHistory.slice(0, 5).map((work) => (
                        <Link 
                          key={work._id} 
                          href={`/aiocr?work=${work._id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  work.tool === 'pdf' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {work.tool === 'pdf' ? 'PDF' : 'IMG'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatDate(work.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {work.originalFilename}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {work.extractedText.substring(0, 50)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatDate(work.createdAt)}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 w-full">
                      <Link 
                        href="/aiocr" 
                        className="inline-flex items-center justify-center px-4 py-2 text-green-600 font-medium text-sm hover:text-green-700 mx-auto"
                        style={{ display: 'block', width: 'max-content' }}
                      >
                        OCR 작업하기 →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <ScanText className="text-green-600" size={32} />
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">OCR 작업을 시작해보세요</h4>
                      <p className="text-sm text-gray-500 mb-6">문서 이미지를 업로드하고 텍스트를 추출해보세요</p>
                      <Link 
                        href="/aiocr" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ScanText size={20} />
                        OCR 작업하기 →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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

export default withAuth(Home);
