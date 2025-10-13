'use client';

import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Search, Plus, Paperclip, SendHorizontal, FileUp, Bot, User, MessageSquare, Edit2, Trash2, MoreVertical } from 'lucide-react';
import withAuth from '@/components/withAuth';
import { useSession } from 'next-auth/react';

function AiLlmPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState('chatbot'); // 'chatbot' or 'embed'
  const [withAnswer, setWithAnswer] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0);
  const messagesEndRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  // 채팅방 관리 상태
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // 채팅방 관리 함수들
  const fetchChatSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions');
      const data = await response.json();
      if (data.success) {
        console.log('Fetched sessions:', data.sessions);
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      setIsCreatingSession(true);
      console.log('Creating new session...');
      
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '새 대화',
          firstMessage: null
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session created:', data);
      
      if (data.success) {
        setChatSessions(prev => [data.session, ...prev]);
        setCurrentSessionId(data.session._id);
        setMessages([]);
        setHasStarted(false);
        return data.session._id; // 생성된 세션 ID 반환
      } else {
        console.error('Failed to create session:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      alert('채팅방 생성에 실패했습니다: ' + error.message);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const selectSession = async (sessionId) => {
    if (sessionId === currentSessionId) return;
    
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentSessionId(sessionId);
        setMessages(data.messages);
        setHasStarted(data.messages.length > 0);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          title: newTitle
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setChatSessions(prev => 
          prev.map(session => 
            session._id === sessionId 
              ? { ...session, title: newTitle }
              : session
          )
        );
        setEditingSessionId(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('정말로 이 대화를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/chat-sessions?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setChatSessions(prev => prev.filter(session => session._id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          setHasStarted(false);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const saveMessageToSession = async (message, sessionId) => {
    if (!sessionId) return;
    
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateMessageInSession = async (thinkingMessageId, newMessage, sessionId) => {
    if (!sessionId) return;
    
    try {
      await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thinkingMessageId,
          newMessage
        })
      });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // 데이터베이스 정리 함수 (개발용)
  const cleanDatabase = async () => {
    if (!confirm('모든 채팅방을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'PATCH'
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Database cleaned:', data.message);
        setChatSessions([]);
        setCurrentSessionId(null);
        setMessages([]);
        setHasStarted(false);
        alert('데이터베이스가 정리되었습니다.');
      }
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  };

  // 컴포넌트 마운트 시 채팅방 목록 로드
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    let sessionId = currentSessionId;
    
    // 현재 세션이 없으면 새 세션 생성
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        console.error('Failed to create session');
        return;
      }
    }

    // 첫 메시지인 경우 환영 메시지 추가
    if (!hasStarted) {
      const welcomeMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `안녕하세요! AI 어시스턴트입니다. ${selectedTool === 'chatbot' ? '챗봇 모드' : '임베딩 검색 모드'}로 도움을 드리겠습니다. 무엇을 도와드릴까요?`,
      };
      setMessages([welcomeMessage]);
      setHasStarted(true);
      await saveMessageToSession(welcomeMessage, sessionId);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    await saveMessageToSession(userMessage, sessionId);
    
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
    await saveMessageToSession(thinkingMessage, sessionId);

    const startTime = Date.now();

    try {
      const requestBody = {
        query: currentInput,
        tool: selectedTool,
        with_answer: withAnswer
      };

      const response = await fetch('/api/chatmcp', {
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
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        responseTime: timeTaken,
      };
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        return [...filteredMessages, botResponse];
      });
      
      // 생각 중 메시지를 실제 응답으로 교체
      await updateMessageInSession(thinkingMessage.id, botResponse, sessionId);
      
      // 첫 번째 사용자 메시지인 경우 제목 자동 생성
      if (messages.length === 1) { // 환영 메시지만 있는 상태에서 첫 사용자 메시지
        const autoTitle = currentInput.length > 30 
          ? currentInput.substring(0, 30) + '...' 
          : currentInput;
        await updateSessionTitle(sessionId, autoTitle);
      }
    } catch (error) {
      console.error('Error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // 동적 메시지 애니메이션 중지
      stopThinkingAnimation();
      
      // "생각 중입니다" 메시지 제거하고 에러 메시지 추가
      const errorResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `에러가 발생했습니다: ${error.message}. 서버가 실행 중인지 확인해주세요.`,
      };
      
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        return [...filteredMessages, errorResponse];
      });
      
      // 생각 중 메시지를 에러 응답으로 교체
      await updateMessageInSession(thinkingMessage.id, errorResponse, sessionId);
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
              <button 
                onClick={createNewSession}
                disabled={isCreatingSession}
                className="flex items-center gap-2 text-sm bg-[#3B86F6] text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span className="hidden md:inline">
                  {isCreatingSession ? 'Creating...' : 'New Chat'}
                </span>
              </button>
              <button 
                onClick={cleanDatabase}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-300"
              >
                정리
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B86F6]"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {chatSessions.filter(session => 
              session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
              <ul className="p-2 space-y-1">
                {chatSessions
                  .filter(session => 
                    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((session) => (
                  <li
                    key={session._id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors relative ${
                      currentSessionId === session._id ? 'bg-blue-100' : 'hover:bg-gray-200/50'
                    }`}
                    onClick={() => selectSession(session._id)}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className={`mt-1 flex-shrink-0 ${
                        currentSessionId === session._id ? 'text-blue-600' : 'text-gray-400'
                      }`} size={20} />
                      <div className="flex-grow overflow-hidden">
                        {editingSessionId === session._id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => updateSessionTitle(session._id, editingTitle)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSessionTitle(session._id, editingTitle);
                              } else if (e.key === 'Escape') {
                                setEditingSessionId(null);
                                setEditingTitle('');
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none font-semibold text-sm text-gray-800"
                            autoFocus
                          />
                        ) : (
                          <div className="w-full">
                            {/* 제목, 날짜, 편집/삭제 버튼이 같은 줄에 */}
                            <div className="flex items-center justify-between gap-2">
                              {/* 제목 */}
                              <h3 className={`font-semibold text-sm truncate flex-1 ${
                                currentSessionId === session._id ? 'text-blue-700' : 'text-gray-800'
                              }`}>{session.title}</h3>
                              
                              {/* 날짜 */}
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </span>
                              
                              {/* 편집/삭제 버튼 */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session._id);
                                    setEditingTitle(session.title);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="편집"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(session._id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1 truncate">{session.lastMessage}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm">
                  {searchQuery ? '검색 결과가 없습니다' : '새로운 대화를 시작해보세요'}
                </p>
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
                  {selectedTool === 'chatbot' ? '탄소배출량 모드' : 'RAG 검색 모드'}
                </p>
              </div>
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <FileUp size={16} />
                  {selectedTool === 'chatbot' ? '탄소배출량 모드' : 'RAG 검색 모드'}
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div
                        onClick={() => {
                          setSelectedTool('chatbot');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'chatbot'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bot className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">🤖 탄소배출량 산정</h4>
                            <p className="text-xs text-gray-600">AI가 질문에 대해 답변을 생성합니다</p>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        onClick={() => {
                          setSelectedTool('embed');
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTool === 'embed'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Search className="text-green-600" size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">🔍 RAG 검색</h4>
                            <p className="text-xs text-gray-600">문서에서 관련 내용을 검색합니다</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTool === 'embed' && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
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
                  </div>
                )}
              </div>
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
                  <p className="text-sm mb-4">챗봇 모드나 RAG 검색 모드를 선택하고 질문을 입력해보세요.</p>
                  <div className="flex gap-2 justify-center">

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

      </div>
    </>
  );
}

export default withAuth(AiLlmPage);
  