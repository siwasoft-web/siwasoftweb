'use client';

import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Search, Plus, Paperclip, SendHorizontal, FileUp, Bot, User, MessageSquare } from 'lucide-react';

// Mock Data
const chatSessions = [
  { id: 1, title: 'RPA Automation Strategy', time: '2h ago', lastMessage: 'Of course. The latest update includes...' },
  { id: 2, title: 'Data Analysis Keywords', time: 'Yesterday', lastMessage: 'Can you provide keywords for...' },
  { id: 3, title: 'LLM Integration Plan', time: '3 days ago', lastMessage: 'Let\'s outline the steps for integration.' },
  { id: 4, title: 'Q3 Marketing Report', time: 'Last week', lastMessage: 'I need the summary of the Q3 report.' },
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
    <div className="bg-transparent min-h-screen p-8">
      <PageHeader title="AI LLM" />

      <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
        {/* Left Panel: Chat Sessions */}
        <aside className="w-1/3 max-w-sm bg-gray-50/50 border-r border-gray-200/80 flex flex-col">
          <div className="p-4 border-b border-gray-200/80">
            <div className="flex justify-between items-center mb-4">
              <button className="flex items-center gap-2 text-sm bg-[#3B86F6] text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                <Plus size={16} />
                New Chat
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
                        <span className="text-xs text-gray-400 flex-shrink-0">{session.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{session.lastMessage}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Panel: Chat Interface */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200/80 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg text-gray-800">RPA Automation Strategy</h2>
            </div>
            <button className="flex items-center gap-2 text-blue-600 border border-[#3B86F6] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer">
              <FileUp size={16} />
              Select Document
            </button>
          </div>
          <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-[#3B86F6] text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#3B86F6] to-blue-600 text-white rounded-br-none' : 'bg-white shadow-sm border border-gray-200/80 text-gray-800 rounded-bl-none'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200/80 bg-white">
            <form onSubmit={handleSend} className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="w-full resize-none border border-gray-300 rounded-lg py-3 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-[#3B86F6] text-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
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
                <button type="submit" className={`p-2 rounded-full transition-colors ${input.trim() ? 'bg-[#3B86F6] text-white hover:bg-blue-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
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
  