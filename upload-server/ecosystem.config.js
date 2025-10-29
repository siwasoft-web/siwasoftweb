{
  "apps": [
    {
      "name": "file-upload-server",
      "script": "server.js",
      "cwd": "/home/siwasoft/siwasoftweb/upload-server",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 8003
      },
      "log_file": "/home/siwasoft/siwasoftweb/upload-server/logs/combined.log",
      "out_file": "/home/siwasoft/siwasoftweb/upload-server/logs/out.log",
      "error_file": "/home/siwasoft/siwasoftweb/upload-server/logs/error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G"
    }
  ]
}
