'use client';

import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Search, Plus, Paperclip, SendHorizontal, FileUp, Bot, User, MessageSquare } from 'lucide-react';

// Chat sessions will be managed dynamically
const chatSessions = [];

export default function AiLlmPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('chatbot'); // 'chatbot' or 'embed'
  const [withAnswer, setWithAnswer] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0);
  const messagesEndRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  // 동적 "생각 중입니다" 메시지들
  const thinkingMessages = [
    '생각 중입니다',
    '질문을 분석하고 있습니다',
    '관련 정보를 검색하고 있습니다',
    '답변을 추론하고 있습니다',
    '최종 답변을 준비하고 있습니다'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, []);

  // 동적 메시지 업데이트 함수
  const updateThinkingMessage = () => {
    setCurrentThinkingMessage(prev => (prev + 1) % thinkingMessages.length);
  };

  // 로딩 시작 시 메시지 업데이트 시작
  const startThinkingAnimation = () => {
    setCurrentThinkingMessage(0);
    thinkingIntervalRef.current = setInterval(updateThinkingMessage, 10000); // 10초마다 변경
  };

  // 로딩 종료 시 메시지 업데이트 중지
  const stopThinkingAnimation = () => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    // 첫 메시지인 경우 환영 메시지 추가
    if (!hasStarted) {
      const welcomeMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `안녕하세요! AI 어시스턴트입니다. ${selectedTool === 'chatbot' ? '챗봇 모드' : '임베딩 검색 모드'}로 도움을 드리겠습니다. 무엇을 도와드릴까요?`,
      };
      setMessages([welcomeMessage]);
      setHasStarted(true);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setResponseTime(null);

    // 동적 메시지 애니메이션 시작
    startThinkingAnimation();

    // "생각 중입니다" 메시지 추가
    const thinkingMessage = {
      id: `thinking-${Date.now()}`,
      sender: 'bot',
      text: thinkingMessages[0],
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    const startTime = Date.now();

    try {
      const apiEndpoint = selectedTool === 'chatbot' ? '/api/chatbot' : '/api/embed';
      const requestBody = selectedTool === 'chatbot' 
        ? { query: currentInput }
        : { query: currentInput, with_answer: withAnswer };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to get response from ${selectedTool}`);
      }

      const data = await response.json();
      
      // 디버깅을 위한 로깅
      console.log('Frontend received data:', data);
      
      // 응답 시간 계산
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
      setResponseTime(timeTaken);
      
      let responseText;
      if (selectedTool === 'chatbot') {
        responseText = data.response || data.answer || 'Sorry, I could not process your request.';
      } else {
        // embed 응답 처리
        if (withAnswer && data.answer) {
          // with_answer=true일 때는 AI 답변만 표시
          responseText = data.answer;
        } else if (data.evidence && data.evidence.length > 0) {
          // with_answer=false일 때는 검색 결과 표시
          responseText = `🔍 검색 결과 (${data.evidence.length}개):\n\n`;
          data.evidence.forEach((item, index) => {
            responseText += `**${item.rank}.** ${item.snippet || '내용 없음'}\n`;
            responseText += `   📊 유사도: ${(item.score * 100).toFixed(1)}%\n`;
            if (item.source_label) {
              responseText += `   📁 출처: ${item.source_label}\n`;
            }
            responseText += '\n';
          });
        } else {
          responseText = '❌ 검색 결과가 없습니다. 다른 키워드로 시도해보세요.';
        }
      }
      
      // 동적 메시지 애니메이션 중지
      stopThinkingAnimation();

      // "생각 중입니다" 메시지 제거하고 실제 응답 추가
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        const botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: responseText,
          responseTime: timeTaken,
        };
        return [...filteredMessages, botResponse];
      });
    } catch (error) {
      console.error('Error:', error);
      // 동적 메시지 애니메이션 중지
      stopThinkingAnimation();
      
      // "생각 중입니다" 메시지 제거하고 에러 메시지 추가
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        const errorResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, there was an error processing your request. Please try again.',
        };
        return [...filteredMessages, errorResponse];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes thinking-dots {
            0%, 20% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            80%, 100% {
              opacity: 0;
            }
          }
          .thinking-dot-1 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0s;
          }
          .thinking-dot-2 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0.2s;
          }
          .thinking-dot-3 {
            animation: thinking-dots 1.4s infinite;
            animation-delay: 0.4s;
          }
        `
      }} />
      <div className="bg-transparent min-h-screen p-8">
        <PageHeader title="AI LLM" />

      <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
        {/* Left Panel: Chat Sessions */}
        <aside className="w-1/3 max-w-sm bg-gray-50/50 border-r border-gray-200/80 flex flex-col">
          <div className="p-4 border-b border-gray-200/80">
            <div className="flex justify-between items-center mb-4">
              <button className="flex items-center gap-2 text-sm bg-[#3B86F6] text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                <Plus size={16} />
                <span className="hidden md:inline">New Chat</span>
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B86F6]"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {chatSessions.length > 0 ? (
              <ul className="p-2 space-y-1">
                {chatSessions.map((session, index) => (
                  <li
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${index === 0 ? 'bg-blue-100' : 'hover:bg-gray-200/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className={`mt-1 flex-shrink-0 ${index === 0 ? 'text-blue-600' : 'text-gray-400'}`} size={20} />
                      <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3 className={`font-semibold text-sm truncate ${index === 0 ? 'text-blue-700' : 'text-gray-800'}`}>{session.title}</h3>
                          <span className="text-xs text-gray-400 flex-shrink-0 hidden md:inline">{session.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{session.lastMessage}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm">새로운 대화를 시작해보세요</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel: Chat Interface */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200/80">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-gray-800">AI Assistant</h2>
                <p className="text-sm text-gray-500">
                  {selectedTool === 'chatbot' ? '챗봇 모드' : '임베딩 검색 모드'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <FileUp size={16} />
                Select Tool
              </button>
            </div>
          </div>
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
            {messages.length > 0 ? (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-[#3B86F6] text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#3B86F6] to-blue-600 text-white rounded-br-none' : 'bg-white shadow-sm border border-gray-200/80 text-gray-800 rounded-bl-none'}`}>
                      {msg.isThinking ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">{thinkingMessages[currentThinkingMessage]}</span>
                          <div className="flex items-center">
                            <span className="thinking-dot-1 text-gray-600">.</span>
                            <span className="thinking-dot-2 text-gray-600">.</span>
                            <span className="thinking-dot-3 text-gray-600">.</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      {msg.responseTime && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{msg.responseTime}초</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Bot className="mx-auto mb-4 text-gray-300" size={48} />
                  <h3 className="text-lg font-medium mb-2">AI 어시스턴트에 오신 것을 환영합니다!</h3>
                  <p className="text-sm mb-4">챗봇 모드나 임베딩 검색 모드를 선택하고 질문을 입력해보세요.</p>
                  <div className="flex gap-2 justify-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">🤖 챗봇</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">🔍 검색</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200/80 bg-white">
            <form onSubmit={handleSend} className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "AI is thinking..." : "Type your message here..."}
                className="w-full resize-none border border-gray-300 rounded-lg py-3 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-[#3B86F6] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={1}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    handleSend(e);
                  }
                }}
              />
              <div className="absolute left-3 flex items-center">
                 <button type="button" className="text-gray-400 hover:text-[#3B86F6] p-2 cursor-pointer">
                  <Paperclip size={20} />
                </button>
              </div>
              <div className="absolute right-3 flex items-center">
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full transition-colors ${
                    input.trim() && !isLoading 
                      ? 'bg-[#3B86F6] text-white hover:bg-blue-600 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <SendHorizontal size={20} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Tool Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">툴 선택</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Chatbot Tool */}
              <div
                onClick={() => {
                  setSelectedTool('chatbot');
                  setIsModalOpen(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTool === 'chatbot'
                    ? 'border-[#3B86F6] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">🤖 챗봇</h4>
                    <p className="text-sm text-gray-600">AI가 질문에 대해 답변을 생성합니다</p>
                  </div>
                </div>
              </div>

              {/* Embed Search Tool */}
              <div
                onClick={() => {
                  setSelectedTool('embed');
                  setIsModalOpen(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTool === 'embed'
                    ? 'border-[#3B86F6] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Search className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">🔍 임베딩 검색</h4>
                    <p className="text-sm text-gray-600">문서에서 관련 내용을 검색합니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Options */}
            {selectedTool === 'embed' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={withAnswer}
                    onChange={(e) => setWithAnswer(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  AI 답변 생성 (권장)
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {withAnswer 
                    ? "검색된 문서를 바탕으로 AI가 최종 답변을 생성합니다" 
                    : "검색 결과 목록만 표시합니다"
                  }
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-[#3B86F6] text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                선택
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
  