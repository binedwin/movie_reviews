export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const APP_CONFIG = {
  name: 'MovieReview',
  version: '1.0.0',
  description: '영화 리뷰 플랫폼',
  author: 'Movie Review Team'
};

export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 50
};

export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 3,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '올바른 이메일 형식을 입력해주세요.'
  },
  password: {
    minLength: 6,
    message: '비밀번호는 6자 이상이어야 합니다.'
  },
  nickname: {
    minLength: 2,
    maxLength: 20,
    message: '닉네임은 2-20자 사이여야 합니다.'
  }
};
