const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// 데이터베이스 연결 테스트
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// 미들웨어 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우트 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: '🎬 Movie Review API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: `경로를 찾을 수 없습니다: ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/movies',
      'GET /api/reviews',
      'GET /api/users'
    ]
  });
});

// 전역 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  
  // Multer 에러 처리
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: '파일 크기가 너무 큽니다. (최대 5MB)' });
  }
  
  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: '토큰이 만료되었습니다.' });
  }
  
  // 기본 에러 응답
  res.status(err.status || 500).json({
    message: err.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    console.log('🔍 데이터베이스 연결 테스트 중...');
    await testConnection();
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log('🚀 서버가 시작되었습니다!');
      console.log(`📍 포트: ${PORT}`);
      console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API 주소: http://localhost:${PORT}`);
      console.log(`🎯 프론트엔드: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log('==================================================');
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    console.log('💡 데이터베이스 연결을 확인해주세요.');
    process.exit(1);
  }
};

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  console.log('🛑 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 서버를 종료합니다...');
  process.exit(0);
});

// 처리되지 않은 Promise rejection 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
