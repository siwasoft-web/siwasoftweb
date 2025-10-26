module.exports = {
  apps: [{
    name: 'siwasoft-api',
    script: './start_api.sh',
    cwd: '/home/siwasoft/siwasoftweb',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      // API Configuration
      API_BASE_URL: 'http://221.139.227.131:8000',
      API_DOMAIN_URL: 'https://siwasoftweb.vercel.app/api',
      EMB_API_BASE: 'http://221.139.227.131:8001',
      EMB_API_DOMAIN: 'https://siwasoftweb.vercel.app/api/embed',
      OCR_API_BASE: 'http://221.139.227.131:8001',
      OCR_API_DOMAIN: 'https://siwasoftweb.vercel.app/api/ocr',
      // NextAuth
      NEXTAUTH_URL: 'https://siwasoftweb.vercel.app',
      // Directory paths
      RAG_TARGET_DIR: '/home/siwasoft/siwasoft/mcp/pdf',
      CARBON_TARGET_DIR: '/home/siwasoft/siwasoft/mcp/carbon',
      CHROMA_PATH: '/home/siwasoft/siwasoft/emd',
      OUTPUT_DIR: '/home/siwasoft/siwasoft/mcp/out',
      ARCHIVE_DIR: '/home/siwasoft/siwasoft/mcp/end'
    },
    env_development: {
      NODE_ENV: 'development',
      API_BASE_URL: 'http://localhost:8000',
      EMB_API_BASE: 'http://localhost:8001',
      OCR_API_BASE: 'http://localhost:8001',
      NEXTAUTH_URL: 'http://localhost:3000'
    }
  }]
}
