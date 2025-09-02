const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

// 데이터베이스 연결 풀 생성 (정상 사용용)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_review_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
});

// 데이터베이스 없이 연결하는 풀 (초기화용)
const tempPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  // database 필드 제거
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// 연결 테스트
const testConnection = async () => {
  try {
    const connection = await tempPool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message);
    console.log('💡 MySQL 서버가 실행 중인지, 데이터베이스 설정이 올바른지 확인해주세요.');
  }
};

// 데이터베이스 초기화 (테이블 생성)
const initializeDatabase = async () => {
  try {
    const connection = await tempPool.getConnection();
    
    // 데이터베이스 생성 (존재하지 않는 경우)
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'movie_review_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // ⭐ 중요: 데이터베이스 선택 (query() 사용 - execute()는 USE 명령어 지원 안함)
    await connection.query(`USE ${process.env.DB_NAME || 'movie_review_db'}`);
    
    // 사용자 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50) NOT NULL,
        profile_image VARCHAR(255),
        favorite_genres JSON,
        social_provider ENUM('local', 'google', 'kakao') DEFAULT 'local',
        social_id VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_social (social_provider, social_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 영화 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        title_en VARCHAR(255),
        description TEXT,
        poster_url VARCHAR(500),
        director VARCHAR(255),
        actors TEXT,
        genres JSON,
        release_date DATE,
        runtime INT,
        rating DECIMAL(3,1) DEFAULT 0,
        review_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_title (title),
        INDEX idx_genre (title),
        INDEX idx_release_date (release_date),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 리뷰 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        movie_id INT NOT NULL,
        content TEXT,
        rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
        images JSON,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_movie (user_id, movie_id),
        INDEX idx_movie_id (movie_id),
        INDEX idx_user_id (user_id),
        INDEX idx_rating (rating),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 리뷰 좋아요 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS review_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        review_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_review (user_id, review_id),
        INDEX idx_review_id (review_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 댓글 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        review_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        INDEX idx_review_id (review_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    connection.release();
    console.log('✅ 데이터베이스 테이블 초기화 완료');
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  }
};

module.exports = {
  pool, // 정상 사용용 풀 (데이터베이스 지정됨)
  testConnection,
  initializeDatabase
};
