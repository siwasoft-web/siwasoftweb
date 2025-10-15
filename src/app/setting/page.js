'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/PageHeader";
import styles from './Setting.module.css';
import { Pencil, Plus } from 'lucide-react';
import withAuth from '@/components/withAuth';

function Setting() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'embedding' | 'documents'
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
  });
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedSources, setEmbedSources] = useState([]);
  // RAG 컬렉션 상태
  const [ragCollections, setRagCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isWorkingRag, setIsWorkingRag] = useState(false);
  const [ragPdfFile, setRagPdfFile] = useState(null);
  // 탄소배출량 임베딩 상태
  const [carbonFile, setCarbonFile] = useState(null);
  const [isWorkingCarbon, setIsWorkingCarbon] = useState(false);
  // Documents 탭 상태
  const [pdfRagDocuments, setPdfRagDocuments] = useState([]);
  const [carbonDocuments, setCarbonDocuments] = useState([]);
  const [selectedPdfRagCollection, setSelectedPdfRagCollection] = useState('');
  const [selectedCarbonCollection, setSelectedCarbonCollection] = useState('');

  // 공통: 안전한 JSON 파서
  const safeParseJson = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return { success: false, error: text || `HTTP ${response.status}` };
  };

  // 사용자 설정 정보 로드
  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user-settings');
      const data = await safeParseJson(response);
      
      if (response.ok && data.success) {
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

  // 임베딩 소스 로드
  const loadEmbeddingSources = async () => {
    try {
      const res = await fetch('/api/user-embeddings');
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        setEmbedSources(data.items);
      }
    } catch (err) {
      console.error('Failed to load embedding sources:', err);
    }
  };
  //변경 테스트 20251015 커밋이되나?
  // RAG 컬렉션 로드
  const loadRagCollections = async () => {
    try {
      console.log('Loading RAG collections...');
      const res = await fetch('/api/rag-collections');
      const data = await safeParseJson(res);
      console.log('Collections API response:', data);
      
      if (res.ok && data.success) {
        const collections = data.items || [];
        console.log('Setting collections:', collections);
        setRagCollections(collections);
        
        if (!selectedCollectionId && collections.length > 0) {
          const firstId = collections[0]._id || collections[0].id;
          console.log('Auto-selecting first collection:', firstId);
          setSelectedCollectionId(firstId);
        }
      } else {
        console.error('Failed to load collections:', data);
        console.error('Response status:', res.status);
        console.error('Response headers:', res.headers);
        
        // API 호출 실패 시 기본 컬렉션들 설정
        const defaultCollections = [
          { _id: 'test', name: 'test' },
          { _id: 'github_repos', name: 'github_repos' },
          { _id: 'docs_agent', name: 'docs_agent' }
        ];
        console.log('Using default collections:', defaultCollections);
        setRagCollections(defaultCollections);
        
        if (!selectedCollectionId && defaultCollections.length > 0) {
          setSelectedCollectionId(defaultCollections[0]._id);
        }
      }
    } catch (err) {
      console.error('컬렉션 로드 실패:', err);
      
      // 에러 발생 시에도 기본 컬렉션들 설정
      const defaultCollections = [
        { _id: 'test', name: 'test' },
        { _id: 'github_repos', name: 'github_repos' },
        { _id: 'docs_agent', name: 'docs_agent' }
      ];
      console.log('Using default collections due to error:', defaultCollections);
      setRagCollections(defaultCollections);
      
      if (!selectedCollectionId && defaultCollections.length > 0) {
        setSelectedCollectionId(defaultCollections[0]._id);
      }
    }
  };

  // 컴포넌트 마운트 시 설정 정보/임베딩 소스 로드
  useEffect(() => {
    loadUserSettings();
    loadEmbeddingSources();
    loadRagCollections();
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
      
      const data = await safeParseJson(response);
      
      if (response.ok && data.success) {
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

  // PDF -> 텍스트 추출 후 저장
  const handleEmbedPdf = async (file) => {
    setIsUploading(true);
    try {
      // 1) Base64 업로드 (AI OCR과 동일 엔드포인트 재사용)
      const reader = new FileReader();
      const textFromPdf = await new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const uploadResponse = await fetch('/api/upload-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file: e.target.result, filename: file.name })
            });
            if (!uploadResponse.ok) throw new Error('파일 업로드 실패');
            const uploadResult = await uploadResponse.json();
            // 2) OCR 실행하여 텍스트 추출
            const ocrResponse = await fetch('/api/ocrmcp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: uploadResult.filename, tool: 'pdf' })
            });
            if (!ocrResponse.ok) throw new Error('OCR 실패');
            const ocrResult = await ocrResponse.json();
            resolve(ocrResult.text || '');
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 3) 텍스트를 사용자 임베딩 소스로 저장
      await saveEmbeddingSource({
        title: embedTitle || file.name,
        content: textFromPdf,
        sourceLabel: file.name
      });
      setEmbedTitle('');
    } catch (err) {
      console.error('임베딩 처리 실패:', err);
      alert('임베딩 처리에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // TXT 파일 저장
  const handleEmbedTxt = async (file) => {
    setIsUploading(true);
    try {
      const text = await file.text();
      await saveEmbeddingSource({
        title: embedTitle || file.name,
        content: text,
        sourceLabel: file.name
      });
      setEmbedTitle('');
    } catch (err) {
      console.error('TXT 저장 실패:', err);
      alert('TXT 저장에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveEmbeddingSource = async ({ title, content, sourceLabel }) => {
    if (!content || content.trim().length === 0) {
      alert('내용이 비어 있습니다.');
      return;
    }
    const res = await fetch('/api/user-embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, sourceLabel })
    });
    const data = await safeParseJson(res);
    if (res.ok && data.success) {
      await loadEmbeddingSources();
      alert('임베딩 소스가 저장되었습니다.');
    } else {
      throw new Error(data.error || '임베딩 저장 실패');
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm('해당 임베딩 소스를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/user-embeddings?id=${id}`, { method: 'DELETE' });
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        setEmbedSources((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  };

  // 컬렉션 생성
  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      alert('컬렉션 이름을 입력하세요.');
      return;
    }
    try {
      setIsWorkingRag(true);
      console.log('컬렉션 생성 요청:', { name });
      
      const res = await fetch('/api/rag-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await safeParseJson(res);
      console.log('컬렉션 생성 응답:', data);
      
      if (!res.ok || !data.success) throw new Error(data.error || '컬렉션 생성 실패');
      setNewCollectionName('');
      await loadRagCollections();
      alert('컬렉션이 생성되었습니다.');
    } catch (err) {
      console.error(err);
      alert('컬렉션 생성에 실패했습니다.');
    } finally {
      setIsWorkingRag(false);
    }
  };

  // 컬렉션 삭제
  const handleDeleteCollection = async () => {
    if (!selectedCollectionId) {
      alert('삭제할 컬렉션을 선택하세요.');
      return;
    }
    if (!confirm('선택한 컬렉션을 삭제하시겠습니까?')) return;
    try {
      setIsWorkingRag(true);
      const res = await fetch(`/api/rag-collections?id=${selectedCollectionId}`, { method: 'DELETE' });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || '컬렉션 삭제 실패');
      await loadRagCollections();
      setSelectedCollectionId('');
      alert('컬렉션이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('컬렉션 삭제에 실패했습니다.');
    } finally {
      setIsWorkingRag(false);
    }
  };

  // PDF RAG 임베딩 실행
  const handleRunRagEmbedding = async () => {
    if (!ragPdfFile) {
      alert('PDF 파일을 선택하세요.');
      return;
    }
    if (!selectedCollectionId) {
      alert('컬렉션을 선택하세요.');
      return;
    }
    try {
      setIsWorkingRag(true);
      
      // 파일을 Base64로 변환
      const reader = new FileReader();
      const base64File = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(ragPdfFile);
      });
      
      const res = await fetch('/api/rag-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file: base64File,
          filename: ragPdfFile.name,
          collection: selectedCollectionId
        })
      });
      
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || '임베딩 실패');
      }
      
      setRagPdfFile(null);
      alert('PDF RAG 임베딩이 완료되었습니다.');
    } catch (err) {
      console.error('PDF RAG 임베딩 실패:', err);
      alert('PDF RAG 임베딩에 실패했습니다: ' + err.message);
    } finally {
      setIsWorkingRag(false);
    }
  };

  // 탄소배출량 임베딩 실행
  const handleRunCarbonEmbedding = async () => {
    if (!carbonFile) {
      alert('파일을 선택하세요.');
      return;
    }
    try {
      setIsWorkingCarbon(true);
      const form = new FormData();
      form.append('file', carbonFile);
      const res = await fetch('/api/carbon-embeddings', {
        method: 'POST',
        body: form
      });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || '임베딩 실패');
      setCarbonFile(null);
      alert('탄소배출량 임베딩이 완료되었습니다.');
    } catch (err) {
      console.error(err);
      alert('탄소배출량 임베딩에 실패했습니다.');
    } finally {
      setIsWorkingCarbon(false);
    }
  };

  // PDF RAG 문서 목록 로드
  const loadPdfRagDocuments = async (collectionId) => {
    if (!collectionId) {
      setPdfRagDocuments([]);
      return;
    }
    try {
      const res = await fetch(`/api/rag-documents?collection=${collectionId}`);
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        setPdfRagDocuments(data.documents || []);
      } else {
        console.error('Failed to load PDF RAG documents:', data.error);
        setPdfRagDocuments([]);
      }
    } catch (err) {
      console.error('Error loading PDF RAG documents:', err);
      setPdfRagDocuments([]);
    }
  };

  // 탄소배출량 문서 목록 로드
  const loadCarbonDocuments = async (collectionId) => {
    if (!collectionId) {
      setCarbonDocuments([]);
      return;
    }
    try {
      const res = await fetch(`/api/carbon-documents?collection=${collectionId}`);
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        setCarbonDocuments(data.documents || []);
      } else {
        console.error('Failed to load carbon documents:', data.error);
        setCarbonDocuments([]);
      }
    } catch (err) {
      console.error('Error loading carbon documents:', err);
      setCarbonDocuments([]);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Setting" />
        <div className={styles.card}>
          <div className={styles.content + " " + styles.centerText}>
            <div className={styles.spinner}></div>
            <p>설정 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Setting" />

      <div className={styles.card}>
        {/* 탭 헤더 */}
        <div className={styles.cardHeader}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('company')}
              className={`${styles.tabButton} ${activeTab==='company' ? styles.tabButtonActive : ''}`}
            >
              Company Plan
            </button>
            <button
              onClick={() => setActiveTab('embedding')}
              className={`${styles.tabButton} ${activeTab==='embedding' ? styles.tabButtonActive : ''}`}
            >
              LLM Setting
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`${styles.tabButton} ${activeTab==='documents' ? styles.tabButtonActive : ''}`}
            >
              Documents
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === 'company' && (
          <div>
          {/* 회사 정보 섹션 */}
          <div className={styles.stackY6}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={styles.titleLg}>회사 정보</h3>
              <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
                <Pencil size={16} />
                <span>편집</span>
              </button>
            </div>

            <div className={styles.stackY6}>
              {/* 회사명 */}
              <div className={styles.gridRow4}>
                <label className={styles.labelText}>회사명</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="회사명을 입력하세요"
                      className={styles.input}
                    />
                  ) : (
                    <span className={styles.mutedText}>{formData.companyName || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 주소 */}
              <div className={styles.gridRow4}>
                <label className={styles.labelText}>주소</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="회사 주소를 입력하세요"
                      className={styles.textarea}
                    />
                  ) : (
                    <span className={styles.mutedText}>{formData.address || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 담당자 정보 섹션 */}
          <div className={styles.dividerTop}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={styles.titleLg}>담당자 정보</h3>
              <button onClick={() => setIsEditing(!isEditing)} className={styles.editBtn}>
                <Pencil size={16} />
                <span>편집</span>
              </button>
            </div>

            <div className={styles.stackY6}>
              {/* 담당자 성함 */}
              <div className={styles.gridRow4}>
                <label className={styles.labelText}>담당자 성함</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="text"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleInputChange}
                      placeholder="담당자 성함을 입력하세요"
                      className={styles.input}
                    />
                  ) : (
                    <span className={styles.mutedText}>{formData.managerName || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 담당자 이메일 */}
              <div className={styles.gridRow4}>
                <label className={styles.labelText}>담당자 이메일</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="email"
                      name="managerEmail"
                      value={formData.managerEmail}
                      onChange={handleInputChange}
                      placeholder="담당자 이메일을 입력하세요"
                      className={styles.input}
                    />
                  ) : (
                    <span className={styles.mutedText}>{formData.managerEmail || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>

              {/* 담당자 연락처 */}
              <div className={styles.gridRow4}>
                <label className={styles.labelText}>담당자 연락처</label>
                <div className="md:col-span-3">
                  {isEditing ? (
                    <input
                      type="tel"
                      name="managerPhone"
                      value={formData.managerPhone}
                      onChange={handleInputChange}
                      placeholder="담당자 연락처를 입력하세요"
                      className={styles.input}
                    />
                  ) : (
                    <span className={styles.mutedText}>{formData.managerPhone || '입력된 정보가 없습니다'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          {isEditing && (
            <div className={styles.actions}>
              <button onClick={() => setIsEditing(false)} disabled={isSaving} className={`${styles.btn} ${styles.btnGhost}`}>
                취소
              </button>
              <button onClick={handleSave} disabled={isSaving} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isSaving ? (
                  '저장 중...'
                ) : (
                  '저장'
                )}
              </button>
            </div>
          )}
          </div>
          )}

          {activeTab === 'embedding' && (
            <div>
              <h3 className={styles.pageTitle}>문서 임베딩</h3>
              {/* 1. PDF RAG 임베딩 */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>1) PDF RAG 임베딩</h4>
                <div className={styles.stackY4}>
                  {/* 파일 선택 */}
                  <div className={styles.fileRow}>
                    <input
                      id="rag-pdf-file"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setRagPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="rag-pdf-file" className={`${styles.fileButton} ${isWorkingRag ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      파일 선택
                    </label>
                    <span className={styles.muted}>{ragPdfFile ? ragPdfFile.name : '선택된 파일 없음'}</span>
                  </div>

                  {/* 컬렉션 선택/생성/삭제 */}
                  <div className={styles.row}>
                    <label className={styles.label}>컬렉션 선택</label>
                    <div className={styles.fields}>
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">컬렉션을 선택하세요</option>
                        {ragCollections.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleDeleteCollection}
                        disabled={isWorkingRag || !selectedCollectionId}
                        className={styles.dangerOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                      >
                        컬렉션 삭제
                      </button>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <label className={styles.label}>컬렉션 생성</label>
                    <div className={styles.fields}>
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="새 컬렉션 이름"
                        className={styles.createInput}
                      />
                      <button
                        onClick={handleCreateCollection}
                        disabled={isWorkingRag}
                        className={styles.primaryOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                      >
                        <Plus size={14} />
                        생성
                      </button>
                    </div>
                  </div>

                  {/* 임베딩 실행 */}
                  <div>
                    <button
                      onClick={handleRunRagEmbedding}
                      disabled={isWorkingRag}
                      className={styles.runButton}
                    >
                      {isWorkingRag ? '임베딩 실행 중...' : '임베딩 실행'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. 탄소배출량 임베딩 */}
              <div className={styles.sectionDivider}>
                <h4 className={styles.sectionTitle}>2) 탄소배출량 임베딩</h4>
                <div className={styles.stackY4}>
                  <div className={styles.fileRow}>
                    <input
                      id="carbon-file"
                      type="file"
                      accept=".pdf,.txt,text/plain,application/pdf"
                      onChange={(e) => setCarbonFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="carbon-file" className={`${styles.fileButton} ${isWorkingCarbon ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      파일 선택
                    </label>
                    <span className={styles.muted}>{carbonFile ? carbonFile.name : '선택된 파일 없음'}</span>
                  </div>
                  <div>
                    <button
                      onClick={handleRunCarbonEmbedding}
                      disabled={isWorkingCarbon}
                      className={styles.runButton}
                    >
                      {isWorkingCarbon ? '임베딩 실행 중...' : '임베딩 실행'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className={styles.pageTitle}>Document Management</h3>
              
              {/* 1. PDF RAG Documents */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>1) PDF RAG</h4>
                <div className={styles.stackY4}>
                  {/* 컬렉션 선택 */}
                  <div className={styles.row}>
                    <label className={styles.label}>Collection List</label>
                    <div className={styles.fields}>
                      <select
                        value={selectedPdfRagCollection}
                        onChange={(e) => {
                          setSelectedPdfRagCollection(e.target.value);
                          loadPdfRagDocuments(e.target.value);
                        }}
                        className={styles.select}
                      >
                        <option value="">Select Collection</option>
                        {ragCollections.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 임베딩된 문서 목록 */}
                  <div className={styles.row}>
                    <label className={styles.label}>Embedded Documents</label>
                    <div className={styles.fields}>
                      <div className={styles.documentList}>
                        {pdfRagDocuments.length > 0 ? (
                          pdfRagDocuments.map((doc, index) => (
                            <div key={index} className={styles.documentItem}>
                              <span className={styles.documentName}>{doc.filename || doc.name || `Document ${index + 1}`}</span>
                              <span className={styles.documentDate}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className={styles.noDocuments}>
                            {selectedPdfRagCollection ? 'No documents found in this collection' : 'Select a collection to view documents'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Carbon Emission Embedding */}
              <div className={styles.sectionDivider}>
                <h4 className={styles.sectionTitle}>2) Carbon Emission Embedding</h4>
                <div className={styles.stackY4}>
                  {/* 컬렉션 선택 */}
                  <div className={styles.row}>
                    <label className={styles.label}>Collection List</label>
                    <div className={styles.fields}>
                      <select
                        value={selectedCarbonCollection}
                        onChange={(e) => {
                          setSelectedCarbonCollection(e.target.value);
                          loadCarbonDocuments(e.target.value);
                        }}
                        className={styles.select}
                      >
                        <option value="">Select Collection</option>
                        {ragCollections.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 임베딩된 문서 목록 */}
                  <div className={styles.row}>
                    <label className={styles.label}>Embedded Documents</label>
                    <div className={styles.fields}>
                      <div className={styles.documentList}>
                        {carbonDocuments.length > 0 ? (
                          carbonDocuments.map((doc, index) => (
                            <div key={index} className={styles.documentItem}>
                              <span className={styles.documentName}>{doc.filename || doc.name || `Document ${index + 1}`}</span>
                              <span className={styles.documentDate}>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className={styles.noDocuments}>
                            {selectedCarbonCollection ? 'No documents found in this collection' : 'Select a collection to view documents'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(Setting);
