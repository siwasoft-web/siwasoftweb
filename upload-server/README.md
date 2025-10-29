# 파일 업로드 서버

PDF와 이미지 파일을 업로드할 수 있는 전용 서버입니다.

## 서버 정보

- **서버 주소**: http://221.139.227.131:8003
- **포트**: 8003
- **PDF 저장 위치**: `/home/siwasoft/siwasoft/mcp/pdf`
- **이미지 저장 위치**: `/home/siwasoft/siwasoft/mcp/img`

## API 엔드포인트

### 1. 서버 상태 확인
```
GET /health
```

### 2. 단일 파일 업로드
```
POST /upload
Content-Type: multipart/form-data
Body: file (PDF 또는 이미지 파일)
```

### 3. 다중 파일 업로드
```
POST /upload-multiple
Content-Type: multipart/form-data
Body: files (PDF 또는 이미지 파일들, 최대 10개)
```

### 4. PDF 파일 목록 조회
```
GET /files/pdf
```

### 5. 이미지 파일 목록 조회
```
GET /files/img
```

## 지원 파일 형식

- **PDF**: application/pdf
- **이미지**: image/jpeg, image/jpg, image/png, image/gif, image/webp

## 파일 크기 제한

- 최대 파일 크기: 50MB

## 서버 실행

### 개발 모드
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

### PM2로 실행
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 사용 예시

### cURL로 파일 업로드
```bash
# PDF 파일 업로드
curl -X POST -F "file=@document.pdf" http://221.139.227.131:8003/upload

# 이미지 파일 업로드
curl -X POST -F "file=@image.jpg" http://221.139.227.131:8003/upload

# 여러 파일 업로드
curl -X POST -F "files=@file1.pdf" -F "files=@file2.jpg" http://221.139.227.131:8003/upload-multiple
```

### JavaScript로 파일 업로드
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://221.139.227.131:8003/upload', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('업로드 성공:', data);
})
.catch(error => {
    console.error('업로드 실패:', error);
});
```

## 응답 형식

### 성공 응답
```json
{
    "success": true,
    "message": "파일이 성공적으로 업로드되었습니다.",
    "file": {
        "originalName": "document.pdf",
        "savedName": "document_1761711542310.pdf",
        "size": 1024000,
        "mimetype": "application/pdf",
        "path": "/home/siwasoft/siwasoft/mcp/pdf/document_1761711542310.pdf",
        "uploadTime": "2025-10-29T04:19:02.311Z"
    }
}
```

### 오류 응답
```json
{
    "success": false,
    "message": "지원하지 않는 파일 타입입니다. PDF 또는 이미지 파일만 업로드 가능합니다."
}
```

## 로그

서버 로그는 다음 위치에서 확인할 수 있습니다:
- `/home/siwasoft/siwasoftweb/upload-server/logs/combined.log`
- `/home/siwasoft/siwasoftweb/upload-server/logs/out.log`
- `/home/siwasoft/siwasoftweb/upload-server/logs/error.log`
