const express = require('express');
const { query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 사용자 프로필 조회
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // 사용자 정보 조회
    const [users] = await pool.execute(
      'SELECT id, nickname, profile_image, favorite_genres, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    // 사용자 통계 조회
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(likes_count) as total_likes_received
      FROM reviews 
      WHERE user_id = ?`,
      [userId]
    );

    // 최근 리뷰 조회 (3개)
    const [recentReviews] = await pool.execute(
      `SELECT 
        r.id, r.content, r.rating, r.created_at,
        m.id as movie_id, m.title, m.poster_url
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 3`,
      [userId]
    );

    // 장르별 리뷰 통계
    const [genreStats] = await pool.execute(
      `SELECT 
        JSON_EXTRACT(m.genres, '$[0]') as genre,
        COUNT(*) as count,
        AVG(r.rating) as avg_rating
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id
      WHERE r.user_id = ?
      GROUP BY JSON_EXTRACT(m.genres, '$[0]')
      ORDER BY count DESC
      LIMIT 5`,
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        profileImage: user.profile_image,
        favoriteGenres: JSON.parse(user.favorite_genres || '[]'),
        createdAt: user.created_at
      },
      stats: {
        totalReviews: stats[0].total_reviews,
        averageRating: parseFloat(stats[0].average_rating) || 0,
        totalLikesReceived: stats[0].total_likes_received || 0
      },
      recentReviews: recentReviews.map(review => ({
        id: review.id,
        content: review.content,
        rating: review.rating,
        createdAt: review.created_at,
        movie: {
          id: review.movie_id,
          title: review.title,
          posterUrl: review.poster_url
        }
      })),
      genreStats: genreStats.map(stat => ({
        genre: stat.genre ? stat.genre.replace(/"/g, '') : 'Unknown',
        count: stat.count,
        averageRating: parseFloat(stat.avg_rating)
      }))
    });

  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 리뷰 목록 조회
router.get('/:id/reviews', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 항목은 1-50개 사이여야 합니다.'),
  query('sortBy').optional().isIn(['rating', 'created_at', 'likes_count']).withMessage('정렬 기준이 올바르지 않습니다.'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('정렬 순서는 asc 또는 desc여야 합니다.'),
], optionalAuth, async (req, res) => {
  try {
    console.log('👤 사용자 리뷰 목록 조회 요청:', req.params.id, req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '요청 파라미터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // 사용자 존재 확인
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 총 리뷰 개수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // 리뷰 목록 조회
    const reviewsQuery = `
      SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at,
        m.id as movie_id, m.title, m.poster_url,
        ${req.user ? `(SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND user_id = ?) as is_liked` : '0 as is_liked'}
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id
      WHERE r.user_id = ?
      ORDER BY r.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

        const queryParams = req.user ? [req.user.id, userId, parseInt(limit), offset] : [userId, parseInt(limit), offset];
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
      movie: {
        id: review.movie_id,
        title: review.title,
        posterUrl: review.poster_url
      }
    }));

    console.log('✅ 사용자 리뷰 조회 완료:', formattedReviews.length, '개');
    
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
    console.error('❌ 사용자 리뷰 목록 조회 오류:', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 내가 좋아요한 리뷰 목록 조회
router.get('/me/liked-reviews', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 항목은 1-50개 사이여야 합니다.'),
], authenticateToken, async (req, res) => {
  try {
    console.log('🔍 좋아요한 리뷰 조회 요청:', req.user.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '요청 파라미터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const {
      page = 1,
      limit = 10
    } = req.query;

    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;

    console.log('🔍 쿼리 파라미터:', { userId, page, limit: limitNum, offset });

    // 총 개수 조회
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM review_likes WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    console.log('🔍 총 좋아요 개수:', total);

    // 좋아요한 리뷰 목록 조회 - query 메서드 사용
    const [likedReviews] = await pool.query(
      `SELECT 
        r.id, r.content, r.rating, r.images, r.likes_count, r.created_at,
        m.id as movie_id, m.title, m.poster_url,
        u.id as user_id, u.nickname, u.profile_image,
        rl.created_at as liked_at
      FROM review_likes rl
      JOIN reviews r ON rl.review_id = r.id
      JOIN movies m ON r.movie_id = m.id
      JOIN users u ON r.user_id = u.id
      WHERE rl.user_id = ?
      ORDER BY rl.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, limitNum, offset]
    );

    // 댓글 개수 조회
    const reviewIds = likedReviews.map(r => r.id);
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

    console.log('🔍 조회된 좋아요한 리뷰:', likedReviews);

    // 리뷰 데이터 포맷팅
    const formattedReviews = likedReviews.map(review => {
      let images = [];
      try {
        images = review.images ? JSON.parse(review.images) : [];
      } catch (e) {
        console.warn('이미지 JSON 파싱 오류:', review.images, e.message);
        images = [];
      }

      return {
        id: review.id,
        content: review.content,
        rating: review.rating,
        images: images,
        likesCount: review.likes_count,
        commentsCount: commentsCount[review.id] || 0,
        isLiked: true,
        createdAt: review.created_at,
        likedAt: review.liked_at,
        movie: {
          id: review.movie_id,
          title: review.title,
          posterUrl: review.poster_url
        },
        user: {
          id: review.user_id,
          nickname: review.nickname,
          profileImage: review.profile_image
        }
      };
    });

    console.log('✅ 좋아요한 리뷰 조회 완료:', formattedReviews.length, '개');

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('❌ 좋아요한 리뷰 목록 조회 오류:', error);
    console.error('❌ 오류 메시지:', error.message);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 통계 조회
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;

    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 기본 통계
    const [basicStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(likes_count) as total_likes_received,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating
      FROM reviews 
      WHERE user_id = ?`,
      [userId]
    );

    // 월별 리뷰 작성 통계 (최근 12개월)
    const [monthlyStats] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as review_count,
        AVG(rating) as avg_rating
      FROM reviews 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC`,
      [userId]
    );

    // 평점별 분포
    const [ratingDistribution] = await pool.execute(
      `SELECT 
        rating,
        COUNT(*) as count
      FROM reviews 
      WHERE user_id = ?
      GROUP BY rating
      ORDER BY rating DESC`,
      [userId]
    );

    // 장르별 통계 (상위 10개)
    const [genreStats] = await pool.execute(
      `SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(m.genres, '$[0]')) as genre,
        COUNT(*) as review_count,
        AVG(r.rating) as avg_rating,
        SUM(r.likes_count) as total_likes
      FROM reviews r
      JOIN movies m ON r.movie_id = m.id
      WHERE r.user_id = ?
      GROUP BY JSON_UNQUOTE(JSON_EXTRACT(m.genres, '$[0]'))
      ORDER BY review_count DESC
      LIMIT 10`,
      [userId]
    );

    res.json({
      basicStats: {
        totalReviews: basicStats[0].total_reviews,
        averageRating: parseFloat(basicStats[0].average_rating) || 0,
        totalLikesReceived: basicStats[0].total_likes_received || 0,
        minRating: parseFloat(basicStats[0].min_rating) || 0,
        maxRating: parseFloat(basicStats[0].max_rating) || 0
      },
      monthlyStats: monthlyStats.map(stat => ({
        month: stat.month,
        reviewCount: stat.review_count,
        averageRating: parseFloat(stat.avg_rating) || 0
      })),
      ratingDistribution: ratingDistribution.map(stat => ({
        rating: parseFloat(stat.rating),
        count: stat.count
      })),
      genreStats: genreStats.map(stat => ({
        genre: stat.genre || 'Unknown',
        reviewCount: stat.review_count,
        averageRating: parseFloat(stat.avg_rating) || 0,
        totalLikes: stat.total_likes || 0
      }))
    });

  } catch (error) {
    console.error('사용자 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
