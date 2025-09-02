const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadReviewImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// 모든 리뷰 목록 조회
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 항목은 1-50개 사이여야 합니다.'),
  query('sortBy').optional().isIn(['rating', 'created_at', 'likes_count']).withMessage('정렬 기준이 올바르지 않습니다.'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('정렬 순서는 asc 또는 desc여야 합니다.'),
], optionalAuth, async (req, res) => {
  try {
    console.log('📝 모든 리뷰 목록 조회 요청:', req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '요청 파라미터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 총 리뷰 개수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews'
    );
    const total = countResult[0].total;

    // 모든 리뷰 목록 조회
    const reviewsQuery = `
      SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at,
        u.id as user_id, u.nickname, u.profile_image,
        m.id as movie_id, m.title, m.poster_url,
        ${req.user ? `(SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND user_id = ?) as is_liked` : '0 as is_liked'}
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN movies m ON r.movie_id = m.id
      ORDER BY r.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const queryParams = req.user ? [req.user.id, Number(limit), offset] : [Number(limit), offset];
    const [reviews] = await pool.query(reviewsQuery, queryParams);

    // 댓글 개수 조회
    const reviewIds = reviews.map(r => r.id);
    let commentsCount = {};
    
    if (reviewIds.length > 0) {
      const [comments] = await pool.query(
        `SELECT review_id, COUNT(*) as count 
         FROM comments 
         WHERE review_id IN (${reviewIds.map(() => '?').join(',')})
         GROUP BY review_id`,
        reviewIds
      );
      
      commentsCount = comments.reduce((acc, comment) => {
        acc[comment.review_id] = comment.count;
        return acc;
      }, {});
    }

    // 리뷰 데이터 포맷팅
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      images: typeof review.images === 'string' ? JSON.parse(review.images || '[]') : (review.images || []),
      likesCount: review.likes_count,
      commentsCount: commentsCount[review.id] || 0,
      isLiked: Boolean(review.is_liked),
      createdAt: review.created_at,
      user: {
        id: review.user_id,
        nickname: review.nickname,
        profileImage: review.profile_image
      },
      movie: {
        id: review.movie_id,
        title: review.title,
        posterUrl: review.poster_url
      }
    }));

    console.log('✅ 모든 리뷰 조회 완료:', formattedReviews.length, '개');

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('❌ 모든 리뷰 목록 조회 오류:', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' }); 
  }
});

// 리뷰 목록 조회 (특정 영화)
router.get('/movie/:movieId', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 항목은 1-50개 사이여야 합니다.'),
  query('sortBy').optional().isIn(['rating', 'created_at', 'likes_count']).withMessage('정렬 기준이 올바르지 않습니다.'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('정렬 순서는 asc 또는 desc여야 합니다.'),
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '요청 파라미터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const movieId = req.params.movieId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // 영화 존재 확인
    const [movies] = await pool.execute(
      'SELECT id FROM movies WHERE id = ?',
      [movieId]
    );

    if (movies.length === 0) {
      return res.status(404).json({ message: '영화를 찾을 수 없습니다.' });
    }

    // 총 리뷰 개수 조회
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM reviews WHERE movie_id = ?',
      [movieId]
    );
    const total = countResult[0].total;

    // 리뷰 목록 조회
    const reviewsQuery = `
      SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at, r.updated_at,
        u.id as user_id, u.nickname, u.profile_image,
        ${req.user ? `(SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND user_id = ?) as is_liked` : '0 as is_liked'}
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.movie_id = ?
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const queryParams = req.user ? [req.user.id, movieId, parseInt(limit), offset] : [movieId, parseInt(limit), offset];
    const [reviews] = await pool.execute(reviewsQuery, queryParams);

    // 댓글 개수 조회
    const reviewIds = reviews.map(r => r.id);
    let commentsCount = {};
    
    if (reviewIds.length > 0) {
      const [comments] = await pool.execute(
        `SELECT review_id, COUNT(*) as count 
         FROM comments 
         WHERE review_id IN (${reviewIds.map(() => '?').join(',')}) 
         GROUP BY review_id`,
        reviewIds
      );
      
      commentsCount = comments.reduce((acc, comment) => {
        acc[comment.review_id] = comment.count;
        return acc;
      }, {});
    }

    // 리뷰 데이터 포맷팅
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      images: JSON.parse(review.images || '[]'),
      likesCount: review.likes_count,
      commentsCount: commentsCount[review.id] || 0,
      isLiked: Boolean(review.is_liked),
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        id: review.user_id,
        nickname: review.nickname,
        profileImage: review.profile_image
      }
    }));

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('리뷰 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 리뷰 상세 조회
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const reviewId = req.params.id;

    // 리뷰 조회
    const reviewQuery = `
      SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at, r.updated_at,
        r.movie_id, m.title as movie_title,
        u.id as user_id, u.nickname, u.profile_image,
        ${req.user ? `(SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND user_id = ?) as is_liked` : '0 as is_liked'}
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN movies m ON r.movie_id = m.id
      WHERE r.id = ?
    `;

    const queryParams = req.user ? [req.user.id, reviewId] : [reviewId];
    const [reviews] = await pool.execute(reviewQuery, queryParams);

    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    const review = reviews[0];

    // 댓글 조회
    const [comments] = await pool.execute(
      `SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.nickname, u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.review_id = ?
      ORDER BY c.created_at ASC`,
      [reviewId]
    );

    res.json({
      review: {
        id: review.id,
        content: review.content,
        rating: review.rating,
        images: JSON.parse(review.images || '[]'),
        likesCount: review.likes_count,
        isLiked: Boolean(review.is_liked),
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        movie: {
          id: review.movie_id,
          title: review.movie_title
        },
        user: {
          id: review.user_id,
          nickname: review.nickname,
          profileImage: review.profile_image
        }
      },
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          id: comment.user_id,
          nickname: comment.nickname,
          profileImage: comment.profile_image
        }
      }))
    });

  } catch (error) {
    console.error('리뷰 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 리뷰 작성
router.post('/', authenticateToken, uploadReviewImages, handleUploadError, [
  body('movieId').isInt({ min: 1 }).withMessage('올바른 영화 ID를 입력해주세요.'),
  body('rating').isFloat({ min: 0.5, max: 5.0 }).withMessage('평점은 0.5부터 5.0 사이여야 합니다.'),
  body('content').optional().isLength({ min: 1, max: 1000 }).withMessage('리뷰 내용은 1-1000자 사이여야 합니다.'),
], async (req, res) => {
  try {
    console.log('📝 리뷰 작성 요청 받음:', req.body);
    console.log('🔑 사용자 정보:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 유효성 검증 실패:', errors.array());
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { movieId, rating, content } = req.body;
    const userId = req.user.id;
    
    console.log('📊 처리할 데이터:', { movieId, rating, content, userId });

    // 영화 존재 확인
    const [movies] = await pool.query(
      'SELECT id FROM movies WHERE id = ?',
      [movieId]
    );

    if (movies.length === 0) {
      return res.status(404).json({ message: '영화를 찾을 수 없습니다.' });
    }

    // 중복 리뷰 확인
    const [existingReviews] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ message: '이미 해당 영화에 대한 리뷰를 작성했습니다.' });
    }

    // 업로드된 이미지 경로 처리
    const images = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    // 리뷰 작성
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, movie_id, content, rating, images) VALUES (?, ?, ?, ?, ?)',
      [userId, movieId, content || null, rating, JSON.stringify(images)]
    );

    const reviewId = result.insertId;
    console.log('✅ 리뷰 삽입 성공, ID:', reviewId);

    // 영화의 평점과 리뷰 수 업데이트
    await updateMovieRating(movieId);
    console.log('✅ 영화 평점 업데이트 완료');

    // 작성된 리뷰 조회
    const [reviews] = await pool.query(
      `SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at,
        u.nickname, u.profile_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [reviewId]
    );

    const review = reviews[0];
    console.log('✅ 작성된 리뷰 조회 완료:', review);

    res.status(201).json({
      message: '리뷰가 작성되었습니다.',
      review: {
        id: review.id,
        content: review.content,
        rating: review.rating,
        images: typeof review.images === 'string' ? JSON.parse(review.images || '[]') : (review.images || []),
        likesCount: review.likes_count,
        createdAt: review.created_at,
        user: {
          nickname: review.nickname,
          profileImage: review.profile_image
        }
      }
    });

  } catch (error) {
    console.error('❌ 리뷰 작성 오류:', error);
    console.error('❌ 오류 스택:', error.stack);
    console.error('❌ SQL 오류 코드:', error.code);
    console.error('❌ SQL 메시지:', error.sqlMessage);
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

// 리뷰 수정
router.put('/:id', authenticateToken, uploadReviewImages, handleUploadError, [
  body('rating').optional().isFloat({ min: 0.5, max: 5.0 }).withMessage('평점은 0.5부터 5.0 사이여야 합니다.'),
  body('content').optional().isLength({ min: 1, max: 1000 }).withMessage('리뷰 내용은 1-1000자 사이여야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const reviewId = req.params.id;
    const { rating, content, keepImages } = req.body;
    const userId = req.user.id;

    // 리뷰 존재 및 소유자 확인
    const [reviews] = await pool.execute(
      'SELECT id, user_id, movie_id, images FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    const review = reviews[0];

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 수정할 권한이 없습니다.' });
    }

    // 업데이트할 필드 구성
    let updateFields = [];
    let updateValues = [];

    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }

    // 이미지 처리
    let images = JSON.parse(review.images || '[]');
    
    if (req.files && req.files.length > 0) {
      // 새 이미지 추가
      const newImages = req.files.map(file => `/uploads/reviews/${file.filename}`);
      
      if (keepImages === 'false') {
        // 기존 이미지 교체
        images = newImages;
      } else {
        // 기존 이미지에 새 이미지 추가
        images = [...images, ...newImages];
      }
      
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(images));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '업데이트할 정보가 없습니다.' });
    }

    updateValues.push(reviewId);

    // 리뷰 업데이트
    await pool.execute(
      `UPDATE reviews SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // 평점이 변경된 경우 영화 평점 업데이트
    if (rating !== undefined) {
      await updateMovieRating(review.movie_id);
    }

    // 업데이트된 리뷰 조회
    const [updatedReviews] = await pool.execute(
      `SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at, r.updated_at,
        u.nickname, u.profile_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [reviewId]
    );

    const updatedReview = updatedReviews[0];

    res.json({
      message: '리뷰가 수정되었습니다.',
      review: {
        id: updatedReview.id,
        content: updatedReview.content,
        rating: updatedReview.rating,
        images: JSON.parse(updatedReview.images || '[]'),
        likesCount: updatedReview.likes_count,
        createdAt: updatedReview.created_at,
        updatedAt: updatedReview.updated_at,
        user: {
          nickname: updatedReview.nickname,
          profileImage: updatedReview.profile_image
        }
      }
    });

  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 리뷰 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    // 리뷰 존재 및 소유자 확인
    const [reviews] = await pool.execute(
      'SELECT id, user_id, movie_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    const review = reviews[0];

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 삭제할 권한이 없습니다.' });
    }

    // 리뷰 삭제 (CASCADE로 좋아요, 댓글도 자동 삭제)
    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // 영화 평점 업데이트
    await updateMovieRating(review.movie_id);

    res.json({ message: '리뷰가 삭제되었습니다.' });

  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 리뷰 좋아요 토글
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    // 리뷰 존재 확인
    const [reviews] = await pool.execute(
      'SELECT id, user_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    // 자신의 리뷰에는 좋아요를 누를 수 없음
    if (reviews[0].user_id === userId) {
      return res.status(400).json({ message: '자신의 리뷰에는 좋아요를 누를 수 없습니다.' });
    }

    // 기존 좋아요 확인
    const [existingLikes] = await pool.execute(
      'SELECT id FROM review_likes WHERE user_id = ? AND review_id = ?',
      [userId, reviewId]
    );

    let isLiked;

    if (existingLikes.length > 0) {
      // 좋아요 취소
      await pool.execute(
        'DELETE FROM review_likes WHERE user_id = ? AND review_id = ?',
        [userId, reviewId]
      );
      isLiked = false;
    } else {
      // 좋아요 추가
      await pool.execute(
        'INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)',
        [userId, reviewId]
      );
      isLiked = true;
    }

    // 리뷰의 좋아요 수 업데이트
    await pool.execute(
      `UPDATE reviews SET likes_count = (
        SELECT COUNT(*) FROM review_likes WHERE review_id = ?
      ) WHERE id = ?`,
      [reviewId, reviewId]
    );

    // 업데이트된 좋아요 수 조회
    const [updatedReviews] = await pool.execute(
      'SELECT likes_count FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({
      message: isLiked ? '리뷰에 좋아요를 눌렀습니다.' : '리뷰 좋아요를 취소했습니다.',
      isLiked,
      likesCount: updatedReviews[0].likes_count
    });

  } catch (error) {
    console.error('리뷰 좋아요 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 리뷰에 댓글 작성
router.post('/:id/comments', authenticateToken, [
  body('content').isLength({ min: 1, max: 500 }).withMessage('댓글 내용은 1-500자 사이여야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const reviewId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    // 리뷰 존재 확인
    const [reviews] = await pool.execute(
      'SELECT id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    // 댓글 작성
    const [result] = await pool.execute(
      'INSERT INTO comments (user_id, review_id, content) VALUES (?, ?, ?)',
      [userId, reviewId, content]
    );

    const commentId = result.insertId;

    // 작성된 댓글 조회
    const [comments] = await pool.execute(
      `SELECT 
        c.id, c.content, c.created_at,
        u.nickname, u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [commentId]
    );

    const comment = comments[0];

    res.status(201).json({
      message: '댓글이 작성되었습니다.',
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        user: {
          nickname: comment.nickname,
          profileImage: comment.profile_image
        }
      }
    });

  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 삭제
router.delete('/:reviewId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { reviewId, commentId } = req.params;
    const userId = req.user.id;

    // 댓글 존재 및 소유자 확인
    const [comments] = await pool.execute(
      'SELECT id, user_id FROM comments WHERE id = ? AND review_id = ?',
      [commentId, reviewId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
    }

    // 댓글 삭제
    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({ message: '댓글이 삭제되었습니다.' });

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 영화 평점 업데이트 헬퍼 함수
const updateMovieRating = async (movieId) => {
  try {
    console.log('📊 영화 평점 업데이트 시작:', movieId);
    const [result] = await pool.query(
      `UPDATE movies SET 
        rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE movie_id = ?), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE movie_id = ?)
      WHERE id = ?`,
      [movieId, movieId, movieId]
    );
    console.log('✅ 영화 평점 업데이트 완료, 영향받은 행:', result.affectedRows);
  } catch (error) {
    console.error('❌ 영화 평점 업데이트 오류:', error);
  }
};

module.exports = router;
