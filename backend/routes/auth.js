const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// 회원가입
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('유효한 이메일을 입력해주세요.'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
  body('nickname').isLength({ min: 2, max: 20 }).withMessage('닉네임은 2-20자 사이여야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { email, password, nickname, favoriteGenres } = req.body;

    // 이메일 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    // 닉네임 중복 확인
    const [existingNicknames] = await pool.execute(
      'SELECT id FROM users WHERE nickname = ?',
      [nickname]
    );

    if (existingNicknames.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 닉네임입니다.' });
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, nickname, favorite_genres) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, nickname, JSON.stringify(favoriteGenres || [])]
    );

    const userId = result.insertId;
    const token = generateToken(userId);

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: userId,
        email,
        nickname,
        favoriteGenres: favoriteGenres || []
      }
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('유효한 이메일을 입력해주세요.'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 사용자 조회
    const [users] = await pool.execute(
      'SELECT id, email, password, nickname, profile_image, favorite_genres FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken(user.id);

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profile_image,
        favoriteGenres: typeof user.favorite_genres === 'string' ? JSON.parse(user.favorite_genres) : (user.favorite_genres || [])
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, nickname, profile_image, favorite_genres, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profile_image,
        favoriteGenres: typeof user.favorite_genres === 'string' ? JSON.parse(user.favorite_genres) : (user.favorite_genres || []),
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 업데이트
router.put('/profile', authenticateToken, uploadProfileImage, handleUploadError, [
  body('nickname').optional().isLength({ min: 2, max: 20 }).withMessage('닉네임은 2-20자 사이여야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { nickname, favoriteGenres } = req.body;
    const userId = req.user.id;
    
    let updateFields = [];
    let updateValues = [];

    if (nickname) {
      // 닉네임 중복 확인 (자신 제외)
      const [existingNicknames] = await pool.execute(
        'SELECT id FROM users WHERE nickname = ? AND id != ?',
        [nickname, userId]
      );

      if (existingNicknames.length > 0) {
        return res.status(400).json({ message: '이미 사용 중인 닉네임입니다.' });
      }

      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }

    if (favoriteGenres) {
      updateFields.push('favorite_genres = ?');
      updateValues.push(JSON.stringify(favoriteGenres));
    }

    if (req.file) {
      const profileImagePath = `/uploads/profiles/${req.file.filename}`;
      updateFields.push('profile_image = ?');
      updateValues.push(profileImagePath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '업데이트할 정보가 없습니다.' });
    }

    updateValues.push(userId);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // 업데이트된 사용자 정보 조회
    const [users] = await pool.execute(
      'SELECT id, email, nickname, profile_image, favorite_genres FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];

    res.json({
      message: '프로필이 업데이트되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profile_image,
        favoriteGenres: typeof user.favorite_genres === 'string' ? JSON.parse(user.favorite_genres) : (user.favorite_genres || [])
      }
    });

  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 변경
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요.'),
  body('newPassword').isLength({ min: 6 }).withMessage('새 비밀번호는 최소 6자 이상이어야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 현재 비밀번호 확인
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // 새 비밀번호 해싱
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({ message: '비밀번호가 변경되었습니다.' });

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
