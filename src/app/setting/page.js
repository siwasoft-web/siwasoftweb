'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/PageHeader";
import { Pencil } from 'lucide-react';
import withAuth from '@/components/withAuth';

function Setting() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
  });

  // 사용자 설정 정보 로드
  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user-settings');
      const data = await response.json();
      
      if (data.success) {
        setFormData(data.settings);
        console.log('Loaded settings:', data.settings);
      } else {
        console.error('Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 설정 정보 로드
  useEffect(() => {
    loadUserSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Settings saved successfully');
        setIsEditing(false);
        alert('설정이 저장되었습니다.');
      } else {
        console.error('Failed to save settings:', data.error);
        alert('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50/50 min-h-screen p-8">
        <PageHeader title="Setting" />
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">설정 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="Setting" />

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-8">
          {/* 회사 정보 섹션 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">회사 정보</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Pencil size={16} />
                <span>편집</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* 회사명 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">회사명</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="회사명을 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.companyName || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 주소 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <label className="text-sm font-medium text-gray-700 pt-2">주소</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="회사 주소를 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.address || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 담당자 정보 섹션 */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">담당자 정보</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Pencil size={16} />
                <span>편집</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* 담당자 성함 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">담당자 성함</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="text"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleInputChange}
                      placeholder="담당자 성함을 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.managerName || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 담당자 이메일 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">담당자 이메일</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="email"
                      name="managerEmail"
                      value={formData.managerEmail}
                      onChange={handleInputChange}
                      placeholder="담당자 이메일을 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.managerEmail || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 담당자 연락처 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">담당자 연락처</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="tel"
                      name="managerPhone"
                      value={formData.managerPhone}
                      onChange={handleInputChange}
                      placeholder="담당자 연락처를 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formData.managerPhone || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          {isEditing && (
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(Setting);
