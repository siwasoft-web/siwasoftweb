'use client';

import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Search, PlusCircle, Paperclip, SendHorizontal, FileUp } from 'lucide-react';

// Mock Data
const chatSessions = [
  { id: 1, title: 'RPA Automation Strategy', time: '2h ago' },
  { id: 2, title: 'Data Analysis Keywords', time: 'Yesterday' },
  { id: 3, title: 'LLM Integration Plan', time: '3 days ago' },
  { id: 4, title: 'Q3 Marketing Report', time: 'Last week' },
];

const initialMessages = [
  { id: 1, sender: 'bot', text: 'Hello! How can I assist you with our AI services today?' },
  { id: 2, sender: 'user', text: 'I need to understand the new features of the RPA platform.' },
  { id: 3, sender: 'bot', text: 'Of course. The latest update includes enhanced data extraction, a more intuitive workflow designer, and advanced analytics. Would you like me to elaborate on any of these?' },
];

export default function AiLlmPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const newMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input,
    };
    setMessages([...messages, newMessage]);
    setInput('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Thank you for your message. I am processing your request...',
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="AI LLM" />

      <div className="flex h-[calc(100vh-150px)] bg-white rounded-lg shadow-md border border-gray-200">
        {/* Left Panel: Chat Sessions */}
        <aside className="w-1/3 max-w-xs border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">대화 목록</h2>
              <button className="text-blue-500 hover:text-blue-700">
                <PlusCircle size={22} />
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full bg-gray-100 border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            <ul>
              {chatSessions.map((session, index) => (
                <li
                  key={session.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${index === 0 ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold text-sm ${index === 0 ? 'text-blue-600' : 'text-gray-700'}`}>{session.title}</h3>
                    <span className="text-xs text-gray-400">{session.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Panel: Chat Interface */}
        <main className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-end items-center">
            <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100 transition-colors">
              <FileUp size={16} />
              문서 선택
            </button>
          </div>
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50/70">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                  <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSend} className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="w-full resize-none border border-gray-300 rounded-lg py-3 pl-4 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSend(e);
                  }
                }}
              />
              <div className="absolute right-3 flex items-center">
                <button type="button" className="text-gray-500 hover:text-blue-500 p-2">
                  <Paperclip size={20} />
                </button>
                <button type="submit" className="text-gray-500 hover:text-blue-500 p-2">
                  <SendHorizontal size={20} />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
  