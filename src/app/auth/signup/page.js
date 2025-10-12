'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mountain } from 'lucide-react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('회원가입이 완료되었습니다. 로그인해주세요.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setError(data.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.');
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mountain className="w-8 h-8 text-white mr-2" />
            <h1 className="text-2xl font-semibold text-white">Siwasoft</h1>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-gray-900 rounded-lg p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white text-center mb-6">회원가입</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호 확인"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-400 text-sm text-center">
                {success}
              </div>
            )}

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">또는 간편 가입</span>
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
              className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
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
            <span className="text-xs text-gray-400">네이버</span>
            <span className="text-xs text-gray-400">카카오</span>
            <span className="text-xs text-gray-400">구글</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <Link 
            href="/auth/signin" 
            className="text-white hover:text-gray-300 transition-colors duration-200"
          >
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
