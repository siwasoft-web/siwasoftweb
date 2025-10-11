'use client';

import React, { useState } from 'react';
import PageHeader from "@/components/PageHeader";
import { Pencil } from 'lucide-react';

export default function Setting() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyNameEn: '',
    companyNumber: '',
    representative: '',
    businessType: '',
    businessCategory: '',
    address: '',
    phoneNumber: '',
    email: '',
    managerName: '',
    managerPosition: '',
    managerRole: '',
    managerPeriod: '',
    managerContactName: '',
    managerContactEmail: '',
    techInfo: '',
    mainProduct: '',
    annualRevenue: '',
    companyStructure: '',
    capital: '',
    smallBusiness: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // 저장 로직 추가
    setIsEditing(false);
    console.log('저장된 데이터:', formData);
  };

  return (
    <div className="bg-gray-50/50 min-h-screen p-8">
      <PageHeader title="Setting" />

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-t-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Company Profile
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'upgrade'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upgrade Plan
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'account'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Account
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-8">
          {activeTab === 'profile' && (
            <div>
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
                  {/* 법인명 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">회사명</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              placeholder="법인명 (국문)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              name="companyNameEn"
                              value={formData.companyNameEn}
                              onChange={handleInputChange}
                              placeholder="법인명 (영문)"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-gray-900">{formData.companyName}</span>
                          <span className="text-sm text-gray-500">회사명 (국문)</span>
                          <span className="text-sm text-gray-500 ml-4">회사명 (영문)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 법인등록번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">법인등록번호</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="companyNumber"
                          value={formData.companyNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.companyNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* 대표자명 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">대표자명</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="representative"
                          value={formData.representative}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.representative}</span>
                      )}
                    </div>
                  </div>

                  {/* 업종(주제) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">업종(주제)</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.businessType}</span>
                      )}
                    </div>
                  </div>

                  {/* 법인 업태번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">법인 업태번호</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="businessCategory"
                          value={formData.businessCategory}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.businessCategory}</span>
                      )}
                    </div>
                  </div>

                  {/* 상사 주소사무 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <label className="text-sm font-medium text-gray-700 pt-2">상사 주소사무</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 담당자 정보 섹션 */}
              <div className="border-t border-gray-200 pt-8 mt-8">
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
                  {/* 법인 연락처 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">법인 연락처</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.phoneNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* 법인 이메일 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <label className="text-sm font-medium text-gray-700 pt-2">법인 이메일</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="이메일"
                            className="sm:col-span-2 lg:col-span-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="managerName"
                            value={formData.managerName}
                            onChange={handleInputChange}
                            placeholder="이름"
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="managerRole"
                            value={formData.managerRole}
                            onChange={handleInputChange}
                            placeholder="역할"
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="managerPosition"
                            value={formData.managerPosition}
                            onChange={handleInputChange}
                            placeholder="직급"
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="managerPeriod"
                            value={formData.managerPeriod}
                            onChange={handleInputChange}
                            placeholder="재직기간"
                            className="sm:col-span-2 lg:col-span-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-gray-900">{formData.email}</span>
                          <span className="text-sm text-gray-500">{formData.managerName}</span>
                          <span className="text-sm text-gray-500">{formData.managerRole}</span>
                          <span className="text-sm text-gray-500">{formData.managerPosition}</span>
                          <span className="text-sm text-gray-500">{formData.managerPeriod}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 담당자 성함 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">담당자 성함</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="managerContactName"
                          value={formData.managerContactName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.managerContactName}</span>
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
                          name="managerContactEmail"
                          value={formData.managerContactEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.managerContactEmail}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 기타 정보 섹션 */}
              <div className="border-t border-gray-200 pt-8 mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">기타 정보</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Pencil size={16} />
                    <span>편집</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 참여사업체 기술정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">참여사업체 기술정보</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="techInfo"
                          value={formData.techInfo}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.techInfo}</span>
                      )}
                    </div>
                  </div>

                  {/* 주요 생산품 (사업분야) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">주요 생산품 (사업분야)</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="mainProduct"
                          value={formData.mainProduct}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.mainProduct}</span>
                      )}
                    </div>
                  </div>

                  {/* 연간 매출액 (전년대비) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">연간 매출액 (전년대비)</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="annualRevenue"
                          value={formData.annualRevenue}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.annualRevenue}</span>
                      )}
                    </div>
                  </div>

                  {/* 업체구도 (해당구도) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">업체구도 (해당구도)</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="companyStructure"
                          value={formData.companyStructure}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.companyStructure}</span>
                      )}
                    </div>
                  </div>

                  {/* 자본금 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">자본금</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="capital"
                          value={formData.capital}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.capital}</span>
                      )}
                    </div>
                  </div>

                  {/* 종소기업업무 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700">종소기업업무</label>
                    <div className="md:col-span-3">
                      {isEditing ? (
                        <input
                          type="text"
                          name="smallBusiness"
                          value={formData.smallBusiness}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-900">{formData.smallBusiness}</span>
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
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    저장
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Upgrade Plan</h3>
              <p className="text-gray-600">업그레이드 플랜 페이지가 준비 중입니다.</p>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h3>
              <p className="text-gray-600">계정 설정 페이지가 준비 중입니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
