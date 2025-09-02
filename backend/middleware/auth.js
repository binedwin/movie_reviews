const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: '액세스 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 확인
    const [users] = await pool.execute(
      'SELECT id, email, nickname, profile_image FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: '토큰이 만료되었습니다.' });
    }
    
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 설정, 없어도 통과)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(
      'SELECT id, email, nickname, profile_image FROM users WHERE id = ?',
      [decoded.userId]
    );

    req.user = users.length > 0 ? users[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};


