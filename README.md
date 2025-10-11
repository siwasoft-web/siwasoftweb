# Siwasoft Web Platform

## 📋 프로젝트 개요

Siwasoft Web Platform은 AI 기반 비즈니스 솔루션을 제공하는 종합 웹 애플리케이션입니다. Next.js 15를 기반으로 구축되었으며, RPA(Robotic Process Automation), AI-LLM 챗봇, AI-OCR 문서 분석 등 다양한 자동화 및 AI 기술을 통합한 플랫폼입니다.

## 🚀 주요 기능

### 1. **HOME (대시보드)**
- 프로젝트 현황 카드 뷰
- AI 기반 서비스 바로가기
- 계정 정보 및 지원 메뉴

### 2. **RPA Analyst**
- RPA 프로젝트 관리 및 생성
- 프로젝트 카드 기반 UI
- 프로젝트 필터링 및 정렬 기능
- 개별 프로젝트 상세 페이지

### 3. **AI-LLM 대화방**
- 자연어 처리 기반 AI 챗봇
- 두 가지 모드 지원:
  - **챗봇 모드**: 일반 대화형 AI 어시스턴트
  - **임베딩 검색 모드**: 문서 기반 질의응답 (RAG)
- 실시간 응답 시간 측정
- 동적 "생각 중입니다" 메시지 애니메이션
- 대화 세션 관리
- FastAPI 백엔드와 연동

### 4. **AI-OCR 문서 분석**
- PDF 및 이미지 파일 업로드 (Drag & Drop 지원)
- 자동 텍스트 추출
- 테이블 데이터 추출
- 두 가지 처리 모드:
  - **PDF 모드**: PDF 문서 처리
  - **이미지 모드**: 이미지 파일 OCR 처리
- 실시간 처리 상태 표시

### 5. **INQUIRY (문의)**
- 사용자 지원 및 문의 관리

### 6. **SETTING (설정)**
- 계정 설정 및 관리

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4
- **UI Components**: 
  - Lucide React (아이콘)
  - React Dropzone (파일 업로드)
  - React TSParticles (배경 효과)
- **State Management**: React Context API (SidebarContext)

### Backend & API
- **API Routes**: Next.js API Routes
- **External API**: FastAPI 백엔드 (localhost:8000)
  - `/chatbot`: 챗봇 API
  - `/embed`: 임베딩 검색 API
  - OCR 처리 API

### Authentication
- **NextAuth.js 4.24.11**
- 지원 인증 방식:
  - Google OAuth
  - Naver OAuth
  - Kakao OAuth
  - 자체 DB 로그인 (Credentials)

### Database
- **MongoDB 6.20.0**
- **bcrypt 6.0.0**: 비밀번호 암호화

### DevOps
- **PM2**: 프로세스 관리
- **Turbopack**: 빠른 개발 빌드

## 📁 프로젝트 구조

```
siwasoftweb/
├── public/                    # 정적 파일
├── src/
│   ├── app/                  # Next.js App Router 페이지
│   │   ├── page.js          # 홈 페이지
│   │   ├── layout.js        # 루트 레이아웃
│   │   ├── globals.css      # 전역 스타일
│   │   ├── aillm/           # AI-LLM 챗봇 페이지
│   │   ├── aiocr/           # AI-OCR 페이지
│   │   ├── rpa/             # RPA 프로젝트 페이지
│   │   ├── inquiry/         # 문의 페이지
│   │   └── setting/         # 설정 페이지
│   ├── assets/              # 이미지 및 미디어 파일
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── PageHeader.js   # 페이지 헤더
│   │   ├── Sidebar.js      # 사이드바 네비게이션
│   │   └── ui/             # UI 컴포넌트
│   │       └── Card.js     # 카드 컴포넌트
│   ├── context/            # React Context
│   │   └── SidebarContext.js
│   ├── pages/              # Pages Router (API 전용)
│   │   └── api/           # API 엔드포인트
│   │       ├── chatmcp.js     # AI 챗봇/임베딩 API
│   │       ├── ocrmcp.js      # OCR API
│   │       ├── upload-pdf.js  # PDF 업로드 API
│   │       └── auth/          # NextAuth API
│   └── Utils/
│       └── db.js           # MongoDB 연결
├── ecosystem.config.js     # PM2 설정
├── next.config.mjs        # Next.js 설정
├── tailwind.config.js     # Tailwind CSS 설정
└── package.json           # 프로젝트 의존성

```

## 🔧 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성 후 다음 변수 설정:

```env
# MongoDB
DB_NAME=siwasoftweb
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_secret_key

# OAuth - Google
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# OAuth - Naver
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# OAuth - Kakao
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

### 3. 개발 서버 실행
```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

### 5. PM2로 실행 (프로덕션)
```bash
pm2 start ecosystem.config.js
```

## 🔌 API 엔드포인트

### Frontend API Routes

#### 1. AI 챗봇/임베딩 API
- **Endpoint**: `/api/chatmcp`
- **Method**: POST
- **Body**:
  ```json
  {
    "query": "질문 내용",
    "tool": "chatbot" | "embed",
    "with_answer": true | false
  }
  ```

#### 2. OCR API
- **Endpoint**: `/api/ocrmcp`
- **Method**: POST
- **Body**:
  ```json
  {
    "filename": "파일명",
    "tool": "pdf" | "img"
  }
  ```

#### 3. PDF 업로드 API
- **Endpoint**: `/api/upload-pdf`
- **Method**: POST
- **Body**:
  ```json
  {
    "file": "base64_encoded_file",
    "filename": "파일명"
  }
  ```

#### 4. NextAuth API
- **Endpoint**: `/api/auth/*`
- 로그인, 로그아웃, 세션 관리

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **다크 모드**: 준비 중
- **애니메이션**: TSParticles를 활용한 인터랙티브 배경
- **접근성**: 시맨틱 HTML 및 ARIA 속성 적용
- **현대적인 디자인**: Tailwind CSS 기반 깔끔한 UI

## 🔐 보안

- **비밀번호 암호화**: bcrypt를 사용한 해시 처리
- **OAuth 인증**: 안전한 소셜 로그인
- **환경 변수**: 민감한 정보는 환경 변수로 관리
- **CORS**: API 요청 보안 설정

## 📦 주요 의존성

```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "next-auth": "4.24.11",
  "mongodb": "6.20.0",
  "bcrypt": "6.0.0",
  "tailwindcss": "4",
  "lucide-react": "0.544.0",
  "react-dropzone": "14.3.8",
  "react-tsparticles": "2.12.2"
}
```

## 🚧 개발 중인 기능

- [ ] 사용자 권한 관리
- [ ] 대화 세션 저장 및 불러오기
- [ ] OCR 결과 히스토리
- [ ] 실시간 협업 기능
- [ ] 다국어 지원 (i18n)

## 📝 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 👥 팀

**Siwasoft Web Development Team**

---

**마지막 업데이트**: 2025년 10월 11일
