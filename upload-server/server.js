const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8003;
const HOST = '221.139.227.131';

// 저장 디렉토리 설정
const PDF_DIR = '/home/siwasoft/siwasoft/mcp/pdf';
const IMG_DIR = '/home/siwasoft/siwasoft/mcp/img';

// 디렉토리가 없으면 생성
if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log(`PDF 디렉토리 생성: ${PDF_DIR}`);
}

if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    console.log(`이미지 디렉토리 생성: ${IMG_DIR}`);
}

// CORS 설정
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 파싱 미들웨어
app.use(express.json());

// Multer 설정 - 파일 타입에 따라 다른 저장 위치
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fileType = file.mimetype;
        
        if (fileType === 'application/pdf') {
            cb(null, PDF_DIR);
        } else if (fileType.startsWith('image/')) {
            cb(null, IMG_DIR);
        } else {
            cb(new Error('지원하지 않는 파일 타입입니다. PDF 또는 이미지 파일만 업로드 가능합니다.'));
        }
    },
    filename: function (req, file, cb) {
        // 원본 파일명에 타임스탬프 추가하여 중복 방지
        const timestamp = Date.now();
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        
        // 파일명을 안전하게 처리
        let safeName;
        try {
            // 인코딩 문제 해결을 위해 Buffer를 사용
            const decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
            const nameWithoutExt = path.basename(decodedName, ext);
            
            console.log(`원본 파일명: "${originalName}"`);
            console.log(`디코딩된 파일명: "${decodedName}"`);
            
            // 한글과 영문, 숫자, 공백만 허용하고 나머지는 언더스코어로 변경
            safeName = nameWithoutExt
                .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '_') // 안전한 문자만 허용 (공백 포함)
                .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
                .replace(/_+/g, '_') // 연속된 언더스코어를 하나로
                .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
                .substring(0, 50); // 파일명 길이 제한
            
            // 빈 문자열이거나 너무 짧은 경우 기본값 사용
            if (!safeName || safeName.length < 2) {
                safeName = 'document';
            }
        } catch (error) {
            console.error('파일명 처리 오류:', error);
            safeName = 'document';
        }
        
        const newFileName = `${safeName}_${timestamp}${ext}`;
        console.log(`파일명 변환: "${originalName}" -> "${newFileName}"`);
        cb(null, newFileName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB 제한
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 타입입니다. PDF 또는 이미지 파일만 업로드 가능합니다.'));
        }
    }
});

// 서버 상태 확인 엔드포인트
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '파일 업로드 서버가 정상적으로 동작 중입니다.',
        timestamp: new Date().toISOString(),
        directories: {
            pdf: PDF_DIR,
            img: IMG_DIR
        }
    });
});

// 파일 업로드 엔드포인트
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '파일이 업로드되지 않았습니다.'
            });
        }

        const fileInfo = {
            originalName: req.file.originalname,
            savedName: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path,
            uploadTime: new Date().toISOString()
        };

        console.log('파일 업로드 성공:', fileInfo);

        res.json({
            success: true,
            message: '파일이 성공적으로 업로드되었습니다.',
            file: fileInfo
        });

    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 업로드 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// Base64 파일 업로드 엔드포인트 (Vercel 호환용)
app.post('/upload-base64', (req, res) => {
    try {
        const { file, filename, mimetype } = req.body;
        
        if (!file || !filename) {
            return res.status(400).json({
                success: false,
                message: '파일 데이터와 파일명이 필요합니다.'
            });
        }

        // Base64 데이터를 Buffer로 변환
        const fileBuffer = Buffer.from(file, 'base64');
        
        // 파일 타입에 따라 저장 위치 결정
        let saveDir, fileExt;
        if (mimetype === 'application/pdf') {
            saveDir = PDF_DIR;
            fileExt = '.pdf';
        } else if (mimetype && mimetype.startsWith('image/')) {
            saveDir = IMG_DIR;
            fileExt = path.extname(filename) || '.jpg';
        } else {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 파일 타입입니다. PDF 또는 이미지 파일만 업로드 가능합니다.'
            });
        }

        // 파일명 생성
        const timestamp = Date.now();
        const originalName = filename;
        const ext = path.extname(originalName);
        
        let safeName;
        try {
            const nameWithoutExt = path.basename(originalName, ext);
            
            // 파일명을 안전하게 처리
            safeName = nameWithoutExt
                .replace(/[^a-zA-Z0-9가-힣\s\-_]/g, '_')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '')
                .substring(0, 50);
            
            if (!safeName || safeName.length < 2) {
                safeName = 'document';
            }
        } catch (error) {
            console.error('파일명 처리 오류:', error);
            safeName = 'document';
        }
        
        const newFileName = `${safeName}_${timestamp}${fileExt}`;
        const filePath = path.join(saveDir, newFileName);
        
        // 파일 저장
        fs.writeFileSync(filePath, fileBuffer);
        
        const fileInfo = {
            originalName: filename,
            savedName: newFileName,
            size: fileBuffer.length,
            mimetype: mimetype,
            path: filePath,
            uploadTime: new Date().toISOString()
        };

        console.log('Base64 파일 업로드 성공:', fileInfo);

        res.json({
            success: true,
            message: '파일이 성공적으로 업로드되었습니다.',
            file: fileInfo
        });

    } catch (error) {
        console.error('Base64 파일 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 업로드 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 여러 파일 업로드 엔드포인트
app.post('/upload-multiple', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '파일이 업로드되지 않았습니다.'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            savedName: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            uploadTime: new Date().toISOString()
        }));

        console.log('다중 파일 업로드 성공:', uploadedFiles);

        res.json({
            success: true,
            message: `${uploadedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`,
            files: uploadedFiles
        });

    } catch (error) {
        console.error('다중 파일 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 업로드 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 업로드된 파일 목록 조회 (PDF)
app.get('/files/pdf', (req, res) => {
    try {
        const files = fs.readdirSync(PDF_DIR).map(file => {
            const filePath = path.join(PDF_DIR, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                uploadTime: stats.mtime,
                path: filePath
            };
        });

        res.json({
            success: true,
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '파일 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 업로드된 파일 목록 조회 (이미지)
app.get('/files/img', (req, res) => {
    try {
        const files = fs.readdirSync(IMG_DIR).map(file => {
            const filePath = path.join(IMG_DIR, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                uploadTime: stats.mtime,
                path: filePath
            };
        });

        res.json({
            success: true,
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '파일 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message || '서버 오류가 발생했습니다.'
    });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`파일 업로드 서버가 시작되었습니다.`);
    console.log(`서버 주소: http://0.0.0.0:${PORT}`);
    console.log(`외부 접근 주소: http://${HOST}:${PORT}`);
    console.log(`PDF 저장 위치: ${PDF_DIR}`);
    console.log(`이미지 저장 위치: ${IMG_DIR}`);
    console.log(`서버 상태 확인: http://${HOST}:${PORT}/health`);
});

module.exports = app;
