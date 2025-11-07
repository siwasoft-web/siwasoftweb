'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

export default function Home() {
  const [activityName, setActivityName] = useState('');
  const [region, setRegion] = useState('');
  const [searchType, setSearchType] = useState(1);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    // 백엔드 API URL 설정
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://221.139.227.131:9004';

    try {
      const result = await axios.post(`${apiUrl}/find_activity`, {
        activity_name: activityName,
        region: region,
        search_type: searchType
      });
      setResponse(result.data);
    } catch (err) {
      setError('데이터를 가져오는데 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h1>제품 검색</h1>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="제품명을 입력하세요"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="지역을 입력하세요 (선택 사항)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className={styles.input}
        />
        <div className={styles.radioGroup}>
          <label>
            <input
              type="radio"
              name="searchType"
              value={1}
              checked={searchType === 1}
              onChange={(e) => setSearchType(parseInt(e.target.value))}
            />
            일반 검색
          </label>
          <label>
            <input
              type="radio"
              name="searchType"
              value={2}
              checked={searchType === 2}
              onChange={(e) => setSearchType(parseInt(e.target.value))}
            />
            대체 제품
          </label>
        </div>
        <button onClick={handleSearch} disabled={loading} className={styles.button}>
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {response && (
        <div className={styles.results}>
          <h2>검색 결과:</h2>
          <div className={styles.resultItem}>
            <p><strong>매칭된 제품:</strong></p> 
            <p>{response.matched_product_name}</p>
            <p><strong>유사도:</strong></p> 
            <p>{response.similarity}</p>
            <p><strong>제품명:</strong></p> 
            <p>{response.product}</p>
            <p><strong>지역:</strong></p> 
            <p>{response.effective_area}</p>
            <p><strong>컬렉션:</strong></p> 
            <p>{response.collection}</p>
            <p><strong>한국_온실가스법률kgCO2eq(GWP):</strong></p> 
            <p>{response.korean_greenhouse_gas_law_kgCO2eq_GWP}</p>
            <p><strong>AR6:</strong></p> 
            <p>{response.AR6}</p>
            <p><strong>AR5:</strong></p> 
            <p>{response.AR5}</p>
            <p><strong>데이터 출처:</strong></p> 
            <p>{response.data_source}</p>
          </div>
        </div>
      )}
    </div>
  );
}
