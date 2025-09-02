const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 영화 목록 조회 (검색, 필터링, 페이징)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('한 페이지당 항목은 1-50개 사이여야 합니다.'),
  query('search').optional().isLength({ min: 1 }).withMessage('검색어를 입력해주세요.'),
  query('genre').optional().isLength({ min: 1 }).withMessage('장르를 선택해주세요.'),
  query('sortBy').optional().isIn(['rating', 'release_date', 'title', 'review_count']).withMessage('정렬 기준이 올바르지 않습니다.'),
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

    const {
      page = 1,
      limit = 20,
      search = '',
      genre = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // 확실한 숫자 변환과 기본값 처리
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    // 쿼리 조건 구성
    let whereConditions = [];
    let queryParams = [];
    
    console.log('📊 API 매개변수:', { page, limit, pageNum, limitNum, offset });

    if (search) {
      whereConditions.push('(title LIKE ? OR title_en LIKE ? OR director LIKE ? OR actors LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (genre) {
      whereConditions.push('JSON_CONTAINS(genres, ?)');
      queryParams.push(JSON.stringify(genre));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM movies ${whereClause}`;
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    // 영화 목록 조회
    const moviesQuery = `
      SELECT 
        id, title, title_en, description, poster_url, director, actors, genres,
        release_date, runtime, rating, review_count, created_at
      FROM movies 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 SQL 실행:', { query: moviesQuery.trim(), params: [...queryParams, limitNum, offset] });
    
    let movies;
    // 임시로 간단한 쿼리 테스트
    if (queryParams.length === 0) {
      // 검색 조건이 없는 경우 - 직접 쿼리 작성
      const simpleQuery = `
        SELECT 
          id, title, title_en, description, poster_url, director, actors, genres,
          release_date, runtime, rating, review_count, created_at
        FROM movies 
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      console.log('🔧 간단한 쿼리 사용:', simpleQuery);
      [movies] = await pool.query(simpleQuery);
    } else {
      // 검색 조건이 있는 경우
      [movies] = await pool.query(moviesQuery, [...queryParams, limitNum, offset]);
    }

    // JSON 필드 파싱
    const formattedMovies = movies.map(movie => ({
      ...movie,
      genres: typeof movie.genres === 'string' ? JSON.parse(movie.genres) : (movie.genres || []),
      actors: movie.actors ? movie.actors.split(',').map(actor => actor.trim()) : []
    }));

    res.json({
      movies: formattedMovies,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('🚨 영화 목록 조회 오류:', error);
    console.error('🔍 오류 스택:', error.stack);
    console.error('🔍 SQL 오류 코드:', error.code);
    console.error('🔍 SQL 메시지:', error.sqlMessage);
    res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
});

// 영화 상세 정보 조회
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const movieId = req.params.id;

    // 영화 정보 조회
    const [movies] = await pool.query(
      `SELECT 
        id, title, title_en, description, poster_url, director, actors, genres,
        release_date, runtime, rating, review_count, created_at
      FROM movies WHERE id = ?`,
      [movieId]
    );

    if (movies.length === 0) {
      return res.status(404).json({ message: '영화를 찾을 수 없습니다.' });
    }

    const movie = movies[0];

    // 리뷰 목록 조회 (최신순 5개)
    const [reviews] = await pool.query(
      `SELECT 
        r.id, r.content, r.rating, r.images, r.created_at,
        u.nickname, u.profile_image,
        r.likes_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.movie_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5`,
      [movieId]
    );

    // 평점 분포 조회
    const [ratingDistribution] = await pool.query(
      `SELECT 
        rating,
        COUNT(*) as count
      FROM reviews 
      WHERE movie_id = ?
      GROUP BY rating
      ORDER BY rating DESC`,
      [movieId]
    );

    // 리뷰 데이터 포맷팅
    const formattedReviews = reviews.map(review => ({
      ...review,
      images: typeof review.images === 'string' ? JSON.parse(review.images) : (review.images || []),
      user: {
        nickname: review.nickname,
        profileImage: review.profile_image
      }
    }));

    res.json({
      ...movie,
      genres: typeof movie.genres === 'string' ? JSON.parse(movie.genres) : (movie.genres || []),
      actors: movie.actors ? movie.actors.split(',').map(actor => actor.trim()) : [],
      recentReviews: formattedReviews,
      ratingDistribution
    });

  } catch (error) {
    console.error('영화 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 영화 등록 (관리자 기능)
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('영화 제목을 입력해주세요.'),
  body('description').optional().isLength({ max: 2000 }).withMessage('줄거리는 2000자를 초과할 수 없습니다.'),
  body('director').notEmpty().withMessage('감독을 입력해주세요.'),
  body('genres').isArray({ min: 1 }).withMessage('장르를 하나 이상 선택해주세요.'),
  body('releaseDate').optional().isISO8601().withMessage('올바른 날짜 형식을 입력해주세요.'),
  body('runtime').optional().isInt({ min: 1 }).withMessage('상영시간은 1분 이상이어야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const {
      title,
      titleEn,
      description,
      posterUrl,
      director,
      actors,
      genres,
      releaseDate,
      runtime
    } = req.body;

    // 영화 제목 중복 확인
    const [existingMovies] = await pool.execute(
      'SELECT id FROM movies WHERE title = ?',
      [title]
    );

    if (existingMovies.length > 0) {
      return res.status(400).json({ message: '이미 등록된 영화입니다.' });
    }

    // 영화 등록
    const [result] = await pool.execute(
      `INSERT INTO movies 
      (title, title_en, description, poster_url, director, actors, genres, release_date, runtime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        titleEn || null,
        description || null,
        posterUrl || null,
        director,
        Array.isArray(actors) ? actors.join(', ') : actors || null,
        JSON.stringify(genres),
        releaseDate || null,
        runtime || null
      ]
    );

    const movieId = result.insertId;

    // 등록된 영화 정보 조회
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE id = ?',
      [movieId]
    );

    const movie = movies[0];

    res.status(201).json({
      message: '영화가 등록되었습니다.',
      movie: {
        ...movie,
        genres: JSON.parse(movie.genres || '[]'),
        actors: movie.actors ? movie.actors.split(',').map(actor => actor.trim()) : []
      }
    });

  } catch (error) {
    console.error('영화 등록 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 영화 정보 수정 (관리자 기능)
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty().withMessage('영화 제목을 입력해주세요.'),
  body('description').optional().isLength({ max: 2000 }).withMessage('줄거리는 2000자를 초과할 수 없습니다.'),
  body('director').optional().notEmpty().withMessage('감독을 입력해주세요.'),
  body('genres').optional().isArray({ min: 1 }).withMessage('장르를 하나 이상 선택해주세요.'),
  body('releaseDate').optional().isISO8601().withMessage('올바른 날짜 형식을 입력해주세요.'),
  body('runtime').optional().isInt({ min: 1 }).withMessage('상영시간은 1분 이상이어야 합니다.'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const movieId = req.params.id;
    const {
      title,
      titleEn,
      description,
      posterUrl,
      director,
      actors,
      genres,
      releaseDate,
      runtime
    } = req.body;

    // 영화 존재 확인
    const [existingMovies] = await pool.execute(
      'SELECT id FROM movies WHERE id = ?',
      [movieId]
    );

    if (existingMovies.length === 0) {
      return res.status(404).json({ message: '영화를 찾을 수 없습니다.' });
    }

    // 업데이트할 필드 구성
    let updateFields = [];
    let updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (titleEn !== undefined) {
      updateFields.push('title_en = ?');
      updateValues.push(titleEn);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (posterUrl !== undefined) {
      updateFields.push('poster_url = ?');
      updateValues.push(posterUrl);
    }
    if (director !== undefined) {
      updateFields.push('director = ?');
      updateValues.push(director);
    }
    if (actors !== undefined) {
      updateFields.push('actors = ?');
      updateValues.push(Array.isArray(actors) ? actors.join(', ') : actors);
    }
    if (genres !== undefined) {
      updateFields.push('genres = ?');
      updateValues.push(JSON.stringify(genres));
    }
    if (releaseDate !== undefined) {
      updateFields.push('release_date = ?');
      updateValues.push(releaseDate);
    }
    if (runtime !== undefined) {
      updateFields.push('runtime = ?');
      updateValues.push(runtime);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: '업데이트할 정보가 없습니다.' });
    }

    updateValues.push(movieId);

    // 영화 정보 업데이트
    await pool.execute(
      `UPDATE movies SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // 업데이트된 영화 정보 조회
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE id = ?',
      [movieId]
    );

    const movie = movies[0];

    res.json({
      message: '영화 정보가 업데이트되었습니다.',
      movie: {
        ...movie,
        genres: JSON.parse(movie.genres || '[]'),
        actors: movie.actors ? movie.actors.split(',').map(actor => actor.trim()) : []
      }
    });

  } catch (error) {
    console.error('영화 정보 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 영화 삭제 (관리자 기능)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const movieId = req.params.id;

    // 영화 존재 확인
    const [existingMovies] = await pool.execute(
      'SELECT id FROM movies WHERE id = ?',
      [movieId]
    );

    if (existingMovies.length === 0) {
      return res.status(404).json({ message: '영화를 찾을 수 없습니다.' });
    }

    // 영화 삭제 (CASCADE로 관련 리뷰도 자동 삭제)
    await pool.execute('DELETE FROM movies WHERE id = ?', [movieId]);

    res.json({ message: '영화가 삭제되었습니다.' });

  } catch (error) {
    console.error('영화 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
