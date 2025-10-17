'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      //console.log('🔍 withAuth session:', session); // ✅ 추가
      //console.log('🔍 withAuth status:', status);   // ✅ 추가
      if (status === 'loading') return; // 로딩 중일 때는 아무것도 하지 않음
      
      if (!session) {
        router.push('/auth/signin');
      }
    }, [session, status, router]);

    // 로딩 중이거나 세션이 없으면 아무것도 렌더링하지 않음
    if (status === 'loading' || !session) {
      return null;
    }

    // 세션이 있으면 원래 컴포넌트 렌더링
    return <WrappedComponent {...props} />;
  };
}
