import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 유효하지 않음
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  updateProfile: (formData) => {
    return api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
};

// 영화 관련 API
export const moviesAPI = {
  getMovies: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/movies?${queryString}`);
  },
  
  getMovie: (id) => 
    api.get(`/movies/${id}`),
  
  createMovie: (movieData) => 
    api.post('/movies', movieData),
  
  updateMovie: (id, movieData) => 
    api.put(`/movies/${id}`, movieData),
  
  deleteMovie: (id) => 
    api.delete(`/movies/${id}`),
};

// 리뷰 관련 API
export const reviewsAPI = {
  getAllReviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reviews?${queryString}`);
  },
  
  getMovieReviews: (movieId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reviews/movie/${movieId}?${queryString}`);
  },
  
  getReview: (id) => 
    api.get(`/reviews/${id}`),
  
  createReview: (reviewData, images = []) => {
    const formData = new FormData();
    formData.append('movieId', reviewData.movieId);
    formData.append('rating', reviewData.rating);
    if (reviewData.content) {
      formData.append('content', reviewData.content);
    }
    
    images.forEach((image) => {
      formData.append('reviewImages', image);
    });
    
    return api.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  updateReview: (id, reviewData, images = [], keepImages = true) => {
    const formData = new FormData();
    if (reviewData.rating !== undefined) {
      formData.append('rating', reviewData.rating);
    }
    if (reviewData.content !== undefined) {
      formData.append('content', reviewData.content);
    }
    formData.append('keepImages', keepImages);
    
    images.forEach((image) => {
      formData.append('reviewImages', image);
    });
    
    return api.put(`/reviews/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteReview: (id) => 
    api.delete(`/reviews/${id}`),
  
  toggleLike: (id) => 
    api.post(`/reviews/${id}/like`),
  
  addComment: (reviewId, content) => 
    api.post(`/reviews/${reviewId}/comments`, { content }),
  
  deleteComment: (reviewId, commentId) => 
    api.delete(`/reviews/${reviewId}/comments/${commentId}`),
};

// 사용자 관련 API
export const usersAPI = {
  getUserProfile: (id) => 
    api.get(`/users/${id}`),
  
  getUserReviews: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${id}/reviews?${queryString}`);
  },
  
  getLikedReviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/me/liked-reviews?${queryString}`);
  },
  
  getUserStats: (id) => 
    api.get(`/users/${id}/stats`),
};

// 파일 업로드 헬퍼
export const uploadAPI = {
  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}${path}`;
  },
};

export default api;
