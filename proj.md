# 다크 모드 적용 계획

## 1. Tailwind CSS 다크 모드 활성화 - 완료
- `tailwind.config.js` 파일에 `darkMode: 'class'` 설정을 추가하여 클래스 기반의 다크 모드를 활성화합니다.

## 2. 테마 컨텍스트(Context API) 생성
- `src/context/ThemeContext.js` 파일을 생성하여 다크모드 적용 여부를 결정하는 컨텍스트를 구현합니다.
- `ThemeProvider` 컴포넌트를 구현하여 애플리케이션 전체를 감쌉니다.
- `useState`와 `useEffect`를 사용하여 테마 상태를 관리하고 `localStorage`에 저장하여 지속성을 유지합니다.

## 3. 테마 프로바이더 적용
- `src/app/layout.js` 파일을 수정하여 최상위 레이아웃을 `ThemeProvider`로 감싸줍니다.

## 4. 테마 전환 UI 추가
- `PageHeader.js` 컴포넌트를 수정하여 '문의하기' 버튼 왼쪽에 다크모드 변경 아이템(예: 아이콘 버튼)을 추가합니다.
- 이 버튼은 `ThemeContext`를 사용하여 테마 상태를 변경하는 역할을 합니다.

## 5. 다크 모드 스타일 적용
- `src/app/globals.css`에서 @import "tailwindcss";는 수정하지 않는다.
- `src/app/globals.css`에서 라이트/다크 모드에 대한 기본 배경색과 텍스트 색상을 정의합니다.
- 기존 컴포넌트들을 검토하고, `dark:` 유틸리티를 사용하여 다크 모드 스타일을 추가합니다.