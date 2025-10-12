'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logo.png';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setIsLoading(true);
    try {
      // 소셜 로그인 시 강제로 계정 선택하도록 설정
      const params = new URLSearchParams({
        callbackUrl: '/',
        prompt: 'select_account'
      });
      
      await signIn(provider, { 
        callbackUrl: `/?${params.toString()}`,
        redirect: true
      });
    } catch (error) {
      setError('소셜 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image src={logo} alt="Siwasoft Logo" width={32} height={32} className="mr-2" />
            <h1 className="text-2xl font-semibold text-gray-800">Siwasoft</h1>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg p-8 shadow-xl border border-gray-200">
          <form onSubmit={handleCredentialsSignIn} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="아이디"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는 간편 로그인</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {/* Naver */}
            <button
              onClick={() => handleSocialSignIn('naver')}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <span className="text-white font-bold text-lg">N</span>
            </button>

            {/* Kakao */}
            <button
              onClick={() => handleSocialSignIn('kakao')}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.5 1.5 4.7 3.8 6.1L5 21l4.5-2.5c1.2.2 2.4.3 3.5.3 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"/>
              </svg>
            </button>

            {/* Google */}
            <button
              onClick={() => handleSocialSignIn('google')}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 border border-gray-300 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
          </div>

          {/* Social Login Labels */}
          <div className="grid grid-cols-3 gap-4 mt-2 text-center">
            <span className="text-xs text-gray-500">네이버</span>
            <span className="text-xs text-gray-500">카카오</span>
            <span className="text-xs text-gray-500">구글</span>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center mt-8">
          <Link 
            href="/auth/signup" 
            className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            처음이신가요? 회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
