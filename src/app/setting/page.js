'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from "@/components/PageHeader";
import styles from './Setting.module.css';
import { Pencil, Plus } from 'lucide-react';
import withAuth from '@/components/withAuth';

function Setting() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'embedding' | 'documents' | 'admin'
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
  // Git RAG 임베딩 상태
  const [gitId, setGitId] = useState('');
  const [isWorkingGit, setIsWorkingGit] = useState(false);
  const [selectedGitCollectionId, setSelectedGitCollectionId] = useState('');
  const [newGitCollectionName, setNewGitCollectionName] = useState('');
  const [gitCollections, setGitCollections] = useState([]);
  const [savedGitSources, setSavedGitSources] = useState([]);
  const [selectedSavedGitId, setSelectedSavedGitId] = useState('');
  const [gitEmbeddings, setGitEmbeddings] = useState([]);
  const [selectedGitEmbeddingId, setSelectedGitEmbeddingId] = useState('');
  // Documents 탭 상태
  const [pdfRagDocuments, setPdfRagDocuments] = useState([]);
  const [carbonDocuments, setCarbonDocuments] = useState([]);
  const [selectedPdfRagCollection, setSelectedPdfRagCollection] = useState('');
  const [selectedCarbonCollection, setSelectedCarbonCollection] = useState('');
  
  // Admin 탭 상태
  const [sites, setSites] = useState([
    { id: 1, name: '시와소프트', code: 'SIWA001' },
    { id: 2, name: '테스트회사', code: 'TEST001' },
    { id: 3, name: '샘플회사', code: 'SAMP001' }
  ]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteCode, setNewSiteCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // 공통: 안전한 JSON 파서
  const safeParseJson = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return { success: false, error: text || `HTTP ${response.status}` };
  };

  // Git ID 마스킹 표시 (요청 규칙)
  const maskGitId = (value) => {
    if (!value) return '';
    const len = value.length;
    if (len === 1) return '*';
    if (len === 2) return value.slice(0, 1) + '*';
    if (len === 3) return value.slice(0, 1) + '**';
    return value.slice(0, 3) + '***';
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
         
         // 자동 선택 제거 - 사용자가 직접 선택하도록 함
         // if (!selectedCollectionId && collections.length > 0) {
         //   const firstId = collections[0]._id || collections[0].id;
         //   console.log('Auto-selecting first collection:', firstId);
         //   setSelectedCollectionId(firstId);
         // }
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
         
         // 자동 선택 제거 - 사용자가 직접 선택하도록 함
         // if (!selectedCollectionId && defaultCollections.length > 0) {
         //   setSelectedCollectionId(defaultCollections[0]._id);
         // }
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
       
       // 자동 선택 제거 - 사용자가 직접 선택하도록 함
       // if (!selectedCollectionId && defaultCollections.length > 0) {
       //   setSelectedCollectionId(defaultCollections[0]._id);
       // }
    }
  };

  // Git용 컬렉션 로드 (emd2)
  const loadGitCollections = async () => {
    try {
      const res = await fetch('/api/rag-collections?chroma=' + encodeURIComponent('/home/siwasoft/siwasoft/emd2'));
      const data = await safeParseJson(res);
       if (res.ok && data.success) {
         const collections = data.items || [];
         setGitCollections(collections);
         // 자동 선택 제거 - 사용자가 직접 선택하도록 함
         // if (!selectedGitCollectionId && collections.length > 0) {
         //   setSelectedGitCollectionId(collections[0]._id || collections[0].id);
         // }
       }
    } catch (err) {
      console.error('Git 컬렉션 로드 실패:', err);
    }
  };

  // 선택된 Git 컬렉션의 임베딩 문서 로드 (emd2)
  const loadGitEmbeddings = async (collectionId) => {
    if (!collectionId) {
      setGitEmbeddings([]);
      setSelectedGitEmbeddingId('');
      return;
    }
    try {
      console.log(`Loading Git embeddings for collection: ${collectionId}`);
      const res = await fetch(`/api/rag-documents?collection=${encodeURIComponent(collectionId)}&chroma=${encodeURIComponent('/home/siwasoft/siwasoft/emd2')}`);
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        console.log(`Found ${data.documents?.length || 0} documents for collection ${collectionId}:`, data.documents);
        console.log('Sample document structure:', data.documents?.[0]);
        setGitEmbeddings(data.documents || []);
        if ((data.documents || []).length > 0) {
          setSelectedGitEmbeddingId(data.documents[0].id);
        }
      } else {
        console.log(`No documents found for collection ${collectionId}:`, data);
        setGitEmbeddings([]);
        setSelectedGitEmbeddingId('');
      }
    } catch (err) {
      console.error('Git 임베딩 로드 실패:', err);
      setGitEmbeddings([]);
      setSelectedGitEmbeddingId('');
    }
  };

  // Git 임베딩을 실제 디렉토리 구조로 트리화 (중복 제거)
  const getGitEmbeddingTree = () => {
    if (!gitEmbeddings || gitEmbeddings.length === 0) {
      console.log('No gitEmbeddings data available');
      return {};
    }
    
    const tree = {};
    const fileMap = new Map(); // 파일 경로별로 첫 번째 문서만 저장
    
    console.log('=== Processing gitEmbeddings ===');
    console.log('Total documents:', gitEmbeddings.length);
    
    // 1단계: 파일별로 첫 번째 문서만 선택 (중복 제거)
    gitEmbeddings.forEach((doc, index) => {
      const filename = doc.filename || doc.name || doc.id;
      
      let repoName = 'siwasoftweb'; // 기본값
      let filePath = filename;
      
      // ID에서 레포지토리명과 파일 경로 추출: "repo:FILE:path:001"
      if (doc.id && doc.id.includes(':')) {
        const parts = doc.id.split(':');
        
        if (parts.length >= 3) {
          repoName = parts[0]; // 첫 번째 부분이 레포지토리명
          // 세 번째 부분에서 파일 경로 추출 (언더스코어를 슬래시로 변환)
          filePath = parts[2].replace(/_/g, '/');
        } else if (parts.length >= 1) {
          repoName = parts[0];
          filePath = filename;
        }
      } else {
        // ID 패턴이 없으면 파일명에서 추출
        if (filename && filename !== 'document_1' && filename !== 'document_2') {
          const parts = filename.split('/');
          if (parts.length >= 2) {
            repoName = parts[0] || 'siwasoftweb';
            filePath = parts.slice(1).join('/');
          } else if (parts.length === 1) {
            repoName = 'siwasoftweb';
            filePath = parts[0];
          }
        }
      }
      
      // 파일 경로를 키로 사용하여 중복 제거
      const fileKey = `${repoName}/${filePath}`;
      if (!fileMap.has(fileKey)) {
        fileMap.set(fileKey, {
          ...doc,
          repoName,
          filePath,
          originalFilename: filename
        });
      }
    });
    
    console.log(`After deduplication: ${fileMap.size} unique files`);
    
    // 2단계: 트리 구조 생성
    fileMap.forEach((doc) => {
      const { repoName, filePath } = doc;
      
      // 레포지토리 루트 생성
      if (!tree[repoName]) {
        tree[repoName] = { 
          files: [], 
          children: {}, 
          type: 'repo',
          totalFiles: 0 
        };
      }
      
      // 파일 경로를 디렉토리 구조로 파싱
      const pathParts = filePath.split('/').filter(part => part.length > 0);
      
      if (pathParts.length === 0) {
        // 루트 파일
        tree[repoName].files.push(doc);
      } else if (pathParts.length === 1) {
        // 루트 레벨 파일
        tree[repoName].files.push(doc);
      } else {
        // 중첩된 디렉토리 구조
        let currentLevel = tree[repoName];
        const fileName = pathParts[pathParts.length - 1];
        const dirs = pathParts.slice(0, -1);
        
        // 디렉토리 구조 생성
        dirs.forEach((dir) => {
          if (!currentLevel.children[dir]) {
            currentLevel.children[dir] = { 
              files: [], 
              children: {}, 
              type: 'folder',
              totalFiles: 0 
            };
          }
          currentLevel = currentLevel.children[dir];
        });
        
        // 마지막 디렉토리에 파일 추가
        currentLevel.files.push(doc);
      }
    });
    
    // 3단계: 각 노드의 총 파일 수 계산 (하위 포함)
    const calculateTotalFiles = (node) => {
      let total = node.files.length;
      Object.values(node.children).forEach(child => {
        total += calculateTotalFiles(child);
      });
      node.totalFiles = total;
      return total;
    };
    
    Object.values(tree).forEach(repo => {
      calculateTotalFiles(repo);
    });

    console.log('=== Final tree structure ===');
    console.log(JSON.stringify(tree, null, 2));
    return tree;
  };

  // 트리 노드 상태 관리
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // 노드 확장/축소 토글
  const toggleNode = (nodePath) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodePath)) {
      newExpanded.delete(nodePath);
    } else {
      newExpanded.add(nodePath);
    }
    setExpandedNodes(newExpanded);
  };
  
  // 트리 구조를 렌더링하는 함수 (커스텀 트리 컴포넌트)
  const renderTreeNodes = (tree, level = 0, parentPath = '') => {
    const nodes = [];
    
    Object.entries(tree).forEach(([name, node], index, array) => {
      const isLast = index === array.length - 1;
      const prefix = isLast ? '└─' : '├─';
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      const indent = '  '.repeat(level);
      
      if (node.type === 'repo') {
        // 레포지토리 루트
        const folderIcon = '📁';
        const hasChildren = (node.files && node.files.length > 0) || (node.children && Object.keys(node.children).length > 0);
        const isExpanded = expandedNodes.has(currentPath);
        
        nodes.push(
          <div key={`repo-${name}-${currentPath}`} className={styles.treeNode}>
            <div 
              className={`${styles.treeNodeHeader} ${styles.treeRepoHeader} ${selectedGitEmbeddingId === `REPO:${name}` ? styles.selected : ''}`}
              onClick={() => {
                if (hasChildren) {
                  toggleNode(currentPath);
                }
                setSelectedGitEmbeddingId(`REPO:${name}`);
              }}
            >
              <span className={styles.treeIndent}>{indent}</span>
              {hasChildren && (
                <span className={styles.treeToggle}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <span className={styles.treeIcon}>{folderIcon}</span>
              <span className={styles.treeName}>{name}/</span>
              <span className={styles.treeCount}>({node.totalFiles}개 파일)</span>
            </div>
            
            {/* 루트 파일들 */}
            {isExpanded && node.files && node.files.length > 0 && (
              <div className={styles.treeChildren}>
                {node.files.map((file, fileIndex) => {
                  const isLastFile = fileIndex === node.files.length - 1 && Object.keys(node.children).length === 0;
                  const filePrefix = isLastFile ? '└─' : '├─';
                  
                  return (
                    <div 
                      key={`file-${file.id}-${currentPath}`}
                      className={`${styles.treeFile} ${selectedGitEmbeddingId === file.id ? styles.selected : ''}`}
                      onClick={() => setSelectedGitEmbeddingId(file.id)}
                    >
                      <span className={styles.treeIndent}>{indent}  </span>
                      <span className={styles.treePrefix}>{filePrefix}</span>
                      <span className={styles.treeFileName}>
                        {file.originalFilename || file.filename || file.name || file.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* 하위 디렉토리들 */}
            {isExpanded && node.children && Object.keys(node.children).length > 0 && (
              <div className={styles.treeChildren}>
                {renderTreeNodes(node.children, level + 1, currentPath)}
              </div>
            )}
          </div>
        );
      } else if (node.type === 'folder') {
        // 폴더
        const folderIcon = '📂';
        const hasChildren = (node.files && node.files.length > 0) || (node.children && Object.keys(node.children).length > 0);
        const isExpanded = expandedNodes.has(currentPath);
        
        nodes.push(
          <div key={`folder-${name}-${level}-${currentPath}`} className={styles.treeNode}>
            <div 
              className={`${styles.treeNodeHeader} ${styles.treeFolderHeader} ${selectedGitEmbeddingId === `FOLDER:${name}` ? styles.selected : ''}`}
              onClick={() => {
                if (hasChildren) {
                  toggleNode(currentPath);
                }
                setSelectedGitEmbeddingId(`FOLDER:${name}`);
              }}
            >
              <span className={styles.treeIndent}>{indent}</span>
              <span className={styles.treePrefix}>{prefix}</span>
              {hasChildren && (
                <span className={styles.treeToggle}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <span className={styles.treeIcon}>{folderIcon}</span>
              <span className={styles.treeName}>{name}/</span>
              <span className={styles.treeCount}>({node.totalFiles}개 파일)</span>
            </div>
            
            {/* 폴더 내 파일들 */}
            {isExpanded && node.files && node.files.length > 0 && (
              <div className={styles.treeChildren}>
                {node.files.map((file, fileIndex) => {
                  const isLastFile = fileIndex === node.files.length - 1 && Object.keys(node.children).length === 0;
                  const filePrefix = isLastFile ? '└─' : '├─';
                  
                  return (
                    <div 
                      key={`file-${file.id}-${currentPath}`}
                      className={`${styles.treeFile} ${selectedGitEmbeddingId === file.id ? styles.selected : ''}`}
                      onClick={() => setSelectedGitEmbeddingId(file.id)}
                    >
                      <span className={styles.treeIndent}>{indent}  </span>
                      <span className={styles.treePrefix}>{filePrefix}</span>
                      <span className={styles.treeFileName}>
                        {file.originalFilename || file.filename || file.name || file.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* 하위 폴더들 */}
            {isExpanded && node.children && Object.keys(node.children).length > 0 && (
              <div className={styles.treeChildren}>
                {renderTreeNodes(node.children, level + 1, currentPath)}
              </div>
            )}
          </div>
        );
      }
    });
    
    return nodes;
  };

  // 프로젝트별 문서 개수 계산
  const getProjectDocumentCount = (projectName) => {
    return gitEmbeddings.filter(doc => {
      if (doc.id && doc.id.includes(':')) {
        const parts = doc.id.split(':');
        return parts.length >= 1 && parts[0] === projectName;
      }
      return false;
    }).length;
  };

  // 저장된 Git ID 로드
  const loadSavedGitSources = async () => {
    try {
      const res = await fetch('/api/user-git-sources');
      const data = await safeParseJson(res);
       if (res.ok && data.success) {
         setSavedGitSources(data.items || []);
         // 자동 선택 제거 - 사용자가 직접 선택하도록 함
         // if (!selectedSavedGitId && (data.items || []).length > 0) {
         //   setSelectedSavedGitId(data.items[0]._id);
         // }
       }
    } catch (err) {
      console.error('Git 소스 로드 실패:', err);
    }
  };

  // 컴포넌트 마운트 시 설정 정보/임베딩 소스 로드
  useEffect(() => {
    loadUserSettings();
    loadEmbeddingSources();
    loadRagCollections(); // PDF/기본 컬렉션
    loadGitCollections(); // Git(emd2) 컬렉션
    loadSavedGitSources(); // 저장된 Git ID 목록
  }, []);

  // 컬렉션 변경 시 임베딩 목록도 갱신
  useEffect(() => {
    loadGitEmbeddings(selectedGitCollectionId);
  }, [selectedGitCollectionId]);

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
            
            // 2) OCR 실행하여 텍스트 추출 (Vercel 환경 고려)
            const ocrRequestBody = {
              filename: uploadResult.filename, 
              tool: 'pdf'
            };
            
            // Vercel 환경인 경우 Base64 데이터 전송
            if (uploadResult.isVercel && uploadResult.base64Data) {
              ocrRequestBody.base64Data = uploadResult.base64Data;
              ocrRequestBody.isVercel = true;
              console.log('Vercel 환경: Base64 데이터로 OCR 처리');
            }
            
            const ocrResponse = await fetch('/api/ocrmcp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ocrRequestBody)
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

  // Git 컬렉션 생성
  const handleCreateGitCollection = async () => {
    const name = newGitCollectionName.trim();
    if (!name) {
      alert('컬렉션 이름을 입력하세요.');
      return;
    }
    try {
      setIsWorkingGit(true);
      console.log('Git 컬렉션 생성 요청:', { name });
      
      const res = await fetch('/api/rag-collections?chroma=' + encodeURIComponent('/home/siwasoft/siwasoft/emd2'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await safeParseJson(res);
      console.log('Git 컬렉션 생성 응답:', data);
      
      if (!res.ok || !data.success) throw new Error(data.error || '컬렉션 생성 실패');
      setNewGitCollectionName('');
      await loadGitCollections();
      alert('컬렉션이 생성되었습니다.');
    } catch (err) {
      console.error(err);
      alert('컬렉션 생성에 실패했습니다.');
    } finally {
      setIsWorkingGit(false);
    }
  };

  // Git 컬렉션 삭제
  const handleDeleteGitCollection = async () => {
    if (!selectedGitCollectionId) {
      alert('삭제할 컬렉션을 선택하세요.');
      return;
    }
    if (!confirm('선택한 컬렉션을 삭제하시겠습니까?')) return;
    try {
      setIsWorkingGit(true);
      const res = await fetch(`/api/rag-collections?id=${selectedGitCollectionId}&chroma=${encodeURIComponent('/home/siwasoft/siwasoft/emd2')}`, { method: 'DELETE' });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || '컬렉션 삭제 실패');
      await loadGitCollections();
      setSelectedGitCollectionId('');
      alert('컬렉션이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('컬렉션 삭제에 실패했습니다.');
    } finally {
      setIsWorkingGit(false);
    }
  };

  // Git ID 저장
  const handleSaveGitId = async () => {
    const value = gitId.trim();
    if (!value) {
      alert('Git ID를 입력하세요.');
      return;
    }
    try {
      setIsWorkingGit(true);
      const res = await fetch('/api/user-git-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitId: value, label: value })
      });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || '저장 실패');
      setGitId('');
      await loadSavedGitSources();
    } catch (err) {
      console.error(err);
      alert('Git ID 저장에 실패했습니다.');
    } finally {
      setIsWorkingGit(false);
    }
  };

  // Git ID 삭제
  const handleDeleteSavedGitId = async (id) => {
    if (!id) return;
    if (!confirm('저장된 Git ID를 삭제하시겠습니까?')) return;
    try {
      setIsWorkingGit(true);
      const res = await fetch(`/api/user-git-sources?id=${id}`, { method: 'DELETE' });
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || '삭제 실패');
      await loadSavedGitSources();
      if (selectedSavedGitId === id) setSelectedSavedGitId('');
    } catch (err) {
      console.error(err);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsWorkingGit(false);
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

  // Git RAG 임베딩 실행
  const handleRunGitEmbedding = async () => {
    const value = (selectedSavedGitId
      ? (savedGitSources.find(s => s._id === selectedSavedGitId)?.gitId || '')
      : gitId).trim();
    if (!value) {
      alert('Git ID를 입력하거나 저장된 항목을 선택하세요.');
      return;
    }
    if (!selectedGitCollectionId) {
      alert('컬렉션을 선택하세요.');
      return;
    }
    try {
      setIsWorkingGit(true);
      
      // 통합 임베딩 API로 요청 (type: 'git'으로 구분)
      const res = await fetch('/api/rag-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          git_id: value,
          collection: selectedGitCollectionId,
          type: 'git'
        })
      });
      
      const data = await safeParseJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Git RAG 임베딩 실패');
      }
      
      // 저장 사용 시 입력값은 유지하지 않아도 됨
      alert('Git RAG 임베딩이 완료되었습니다.');
    } catch (err) {
      console.error('Git RAG 임베딩 실패:', err);
      alert('Git RAG 임베딩에 실패했습니다: ' + err.message);
    } finally {
      setIsWorkingGit(false);
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

  // 새 사이트 추가
  const handleAddSite = () => {
    if (!newSiteName.trim() || !newSiteCode.trim()) {
      alert('회사명과 회사코드를 모두 입력하세요.');
      return;
    }
    
    const newSite = {
      id: Date.now(),
      name: newSiteName.trim(),
      code: newSiteCode.trim().toUpperCase()
    };
    
    setSites([...sites, newSite]);
    setNewSiteName('');
    setNewSiteCode('');
    setShowAddForm(false);
  };

  // 사이트 삭제
  const handleDeleteSite = (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setSites(sites.filter(site => site.id !== id));
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
            <button
              onClick={() => setActiveTab('admin')}
              className={`${styles.tabButton} ${activeTab==='admin' ? styles.tabButtonActive : ''}`}
            >
              Admin
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

              {/* 3. Git RAG 임베딩 */}
              <div className={styles.sectionDivider}>
                <h4 className={styles.sectionTitle}>3) Git RAG 임베딩</h4>
                <div className={styles.stackY4}>
                  <div className={styles.row}>
                    <label className={styles.label}>Git ID</label>
                    <div className={styles.fields}>
                      <input
                        type="text"
                        value={gitId}
                        onChange={(e) => setGitId(e.target.value)}
                        placeholder="사용자명을 입력하세요"
                        className={`${styles.input} ${styles.gitInput}`}
                        disabled={isWorkingGit}
                      />
                      <button
                        onClick={handleSaveGitId}
                        disabled={isWorkingGit || !gitId.trim()}
                        className={styles.primaryOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                      >
                        저장
                      </button>
                    </div>
                  </div>

                  {/* 저장된 Git ID 목록 */}
                  <div className={styles.row}>
                    <label className={`${styles.label} ${styles.noWrap}`}>저장된 Git ID</label>
                    <div className={styles.fields}>
                      <select
                        value={selectedSavedGitId}
                        onChange={(e) => setSelectedSavedGitId(e.target.value)}
                        className={`${styles.select} ${styles.savedGitSelect}`}
                        disabled={isWorkingGit}
                      >
                        <option value="">선택 안 함</option>
                        {savedGitSources.map((s) => (
                          <option key={s._id} value={s._id}>{maskGitId(s.gitId)}</option>
                        ))}
                      </select>
                      {selectedSavedGitId && (
                        <button
                          onClick={() => handleDeleteSavedGitId(selectedSavedGitId)}
                          disabled={isWorkingGit}
                          className={styles.dangerOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Git 컬렉션 선택/생성/삭제 */}
                  <div className={styles.row}>
                    <label className={styles.label}>컬렉션 선택</label>
                    <div className={styles.fields}>
                      <select
                        value={selectedGitCollectionId}
                        onChange={(e) => setSelectedGitCollectionId(e.target.value)}
                        className={styles.select}
                        disabled={isWorkingGit}
                      >
                        <option value="">컬렉션을 선택하세요</option>
                        {gitCollections.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleDeleteGitCollection}
                        disabled={isWorkingGit || !selectedGitCollectionId}
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
                        value={newGitCollectionName}
                        onChange={(e) => setNewGitCollectionName(e.target.value)}
                        placeholder="새 컬렉션 이름"
                        className={styles.createInput}
                        disabled={isWorkingGit}
                      />
                      <button
                        onClick={handleCreateGitCollection}
                        disabled={isWorkingGit}
                        className={styles.primaryOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                      >
                        <Plus size={14} />
                        생성
                      </button>
                    </div>
                  </div>

               {/* 임베딩 삭제 (Git 전용) */}
               <div className={styles.row}>
                 <label className={styles.label}>임베딩 </label>
                 <div className={styles.fields}>
                   <div className={`${styles.treeContainer} ${isWorkingGit || !selectedGitCollectionId ? styles.disabled : ''}`}>
                     <div className={styles.treeContent}>
                       {(() => {
                         const tree = getGitEmbeddingTree();
                         console.log('Rendering tree:', tree);
                         const nodes = renderTreeNodes(tree, 0, '');
                         console.log('Generated nodes:', nodes.length, 'items');
                         return nodes;
                       })()}
                     </div>
                   </div>
                   <button
                     onClick={async () => {
                       if (!selectedGitCollectionId || !selectedGitEmbeddingId) return;
                       
                        const isRepoDelete = selectedGitEmbeddingId.startsWith('REPO:');
                        const isFolderDelete = selectedGitEmbeddingId.startsWith('FOLDER:');
                        const repoName = isRepoDelete ? selectedGitEmbeddingId.replace('REPO:', '') : null;
                        const folderName = isFolderDelete ? selectedGitEmbeddingId.replace('FOLDER:', '') : null;
                        
                        let docCount = 1;
                        let confirmMessage = '선택한 임베딩을 삭제하시겠습니까?';
                        
                        if (isRepoDelete) {
                          docCount = getProjectDocumentCount(repoName);
                          confirmMessage = `레포지토리 "${repoName}"의 모든 임베딩 (${docCount}개 문서)을 삭제하시겠습니까?`;
                        } else if (isFolderDelete) {
                          // 폴더 삭제 시 해당 폴더의 파일 수 계산
                          const tree = getGitEmbeddingTree();
                          const findFolderCount = (node, targetFolder) => {
                            if (node.children && node.children[targetFolder]) {
                              return node.children[targetFolder].totalFiles;
                            }
                            for (const child of Object.values(node.children || {})) {
                              const count = findFolderCount(child, targetFolder);
                              if (count > 0) return count;
                            }
                            return 0;
                          };
                          
                          for (const repo of Object.values(tree)) {
                            const count = findFolderCount(repo, folderName);
                            if (count > 0) {
                              docCount = count;
                              break;
                            }
                          }
                          confirmMessage = `폴더 "${folderName}"의 모든 임베딩 (${docCount}개 문서)을 삭제하시겠습니까?`;
                        }
                       
                       if (!confirm(confirmMessage)) return;
                       
                       try {
                         setIsWorkingGit(true);
                         
                          if (isRepoDelete) {
                            // 레포지토리 단위 삭제
                            const res = await fetch(`/api/rag-delete-project?collection=${encodeURIComponent(selectedGitCollectionId)}&project=${encodeURIComponent(repoName)}&chroma=${encodeURIComponent('/home/siwasoft/siwasoft/emd2')}`, { method: 'DELETE' });
                            const data = await safeParseJson(res);
                            if (!res.ok || !data.success) throw new Error(data.error || '레포지토리 삭제 실패');
                            
                            let message = `레포지토리 "${repoName}"의 ${data.deletedCount}개 문서가 삭제되었습니다.`;
                            if (data.stateFileUpdated) {
                              message += '\n컬렉션 상태 파일에서도 해당 레포지토리가 제거되었습니다.';
                            } else {
                              message += '\n(컬렉션 상태 파일에 해당 레포지토리가 등록되지 않아 업데이트를 건너뛰었습니다)';
                            }
                            alert(message);
                          } else if (isFolderDelete) {
                            // 폴더 단위 삭제 (기존 프로젝트 삭제 API 재사용)
                            const res = await fetch(`/api/rag-delete-project?collection=${encodeURIComponent(selectedGitCollectionId)}&project=${encodeURIComponent(folderName)}&chroma=${encodeURIComponent('/home/siwasoft/siwasoft/emd2')}`, { method: 'DELETE' });
                            const data = await safeParseJson(res);
                            if (!res.ok || !data.success) throw new Error(data.error || '폴더 삭제 실패');
                            alert(`폴더 "${folderName}"의 ${data.deletedCount}개 문서가 삭제되었습니다.`);
                          } else {
                            // 개별 문서 삭제
                            const res = await fetch(`/api/rag-delete-document?collection=${encodeURIComponent(selectedGitCollectionId)}&id=${encodeURIComponent(selectedGitEmbeddingId)}&chroma=${encodeURIComponent('/home/siwasoft/siwasoft/emd2')}`, { method: 'DELETE' });
                            const data = await safeParseJson(res);
                            if (!res.ok || !data.success) throw new Error(data.error || '삭제 실패');
                            alert('임베딩이 삭제되었습니다.');
                          }
                         
                         await loadGitEmbeddings(selectedGitCollectionId);
                         setSelectedGitEmbeddingId('');
                       } catch (err) {
                         console.error('임베딩 삭제 실패:', err);
                         alert('임베딩 삭제에 실패했습니다.');
                       } finally {
                         setIsWorkingGit(false);
                       }
                     }}
                     disabled={isWorkingGit || !selectedGitCollectionId || !selectedGitEmbeddingId}
                     className={styles.dangerOutline + " disabled:opacity-50 disabled:cursor-not-allowed"}
                   >
                     삭제
                   </button>
                 </div>
               </div>

                  <div>
                    <button
                      onClick={handleRunGitEmbedding}
                      disabled={isWorkingGit}
                      className={styles.runButton}
                    >
                      {isWorkingGit ? '임베딩 실행 중...' : '임베딩 실행'}
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

            {activeTab === 'admin' && (
              <div>
                <h3 className={styles.pageTitle}>사이트 목록</h3>
                
                {/* 사이트 목록 테이블 */}
                <div className="mb-10">
                  <div className="overflow-hidden rounded-2xl bg-gray-50 shadow-lg border border-gray-200 max-w-4xl">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200 shadow-sm">
                            <th className="px-6 py-5 text-left text-sm font-extrabold text-blue-900 uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                회사명
                              </div>
                            </th>
                            <th className="px-6 py-5 text-left text-sm font-extrabold text-indigo-900 uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                회사코드
                              </div>
                            </th>
                            <th className="px-6 py-5 text-center text-sm font-extrabold text-emerald-900 uppercase tracking-widest">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                확인
                              </div>
                            </th>
                            <th className="px-6 py-5 text-center text-sm font-extrabold text-purple-900 uppercase tracking-widest">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                기능
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {sites.map((site) => (
                            <tr key={site.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-800">{site.name}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-md">
                                  {site.code}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full text-gray-800 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-200 shadow-sm hover:shadow-md">
                                  확인
                                </button>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-colors duration-200 shadow-sm hover:shadow-md">
                                    수정
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSite(site.id)}
                                    className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 transition-colors duration-200 shadow-sm hover:shadow-md"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* 사이트 개수 표시 */}
                  <div className="mt-4 max-w-4xl">
                    <p className="text-xs text-gray-400">
                      총 {sites.length}건 표시 중 (원본 {sites.length}건)
                    </p>
                  </div>
                  
                  {/* 새 사이트 추가 폼 */}
                  {showAddForm && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-4xl">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">새 사이트 추가</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
                          <input
                            type="text"
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            placeholder="회사명을 입력하세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">회사코드</label>
                          <input
                            type="text"
                            value={newSiteCode}
                            onChange={(e) => setNewSiteCode(e.target.value.toUpperCase())}
                            placeholder="회사코드를 입력하세요"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleAddSite}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 새 사이트 추가 버튼 */}
                  <div className="mt-2 flex justify-end max-w-4xl">
                    <button 
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus size={18} className="mr-2" />
                      {showAddForm ? '추가 취소' : '사이트 생성'}
                    </button>
                  </div>
                </div>
                  <hr className="my-6 border-0 h-px bg-gray-200" />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(Setting);
