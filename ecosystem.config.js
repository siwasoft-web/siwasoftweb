module.exports = {
  apps: [{
    name: 'siwasoft-api',
    script: './start_api.sh',
    cwd: '/home/siwasoft/siwasoftweb',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
