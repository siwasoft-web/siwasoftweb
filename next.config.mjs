/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경 변수 설정
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    API_DOMAIN_URL: process.env.API_DOMAIN_URL,
    EMB_API_BASE: process.env.EMB_API_BASE,
    EMB_API_DOMAIN: process.env.EMB_API_DOMAIN,
    OCR_API_BASE: process.env.OCR_API_BASE,
    OCR_API_DOMAIN: process.env.OCR_API_DOMAIN,
  },
  
  // 이미지 도메인 설정 (IP와 도메인 모두 허용)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '221.139.227.131',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'siwasoftweb.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // CORS 설정 (개발 환경에서만)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : 'https://siwasoftweb.vercel.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
