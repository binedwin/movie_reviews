-- MovieReview 데이터베이스 구조 확인 쿼리들
-- MySQL Workbench에서 하나씩 실행해보세요

-- 1. 데이터베이스 선택
USE movie_review_db;

-- 2. 모든 테이블 목록 보기
SHOW TABLES;

-- 3. 각 테이블의 구조 확인
DESCRIBE users;
DESCRIBE movies;
DESCRIBE reviews;
DESCRIBE review_likes;
DESCRIBE comments;

-- 4. 외래키 관계 시각화
SELECT 
    TABLE_NAME as '테이블',
    COLUMN_NAME as '컬럼',
    CONSTRAINT_NAME as '제약조건명',
    REFERENCED_TABLE_NAME as '참조테이블',
    REFERENCED_COLUMN_NAME as '참조컬럼'
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'movie_review_db'
ORDER BY TABLE_NAME;

-- 5. 테이블별 데이터 확인
SELECT 'users 테이블' as 테이블명, COUNT(*) as 레코드수 FROM users
UNION ALL
SELECT 'movies 테이블', COUNT(*) FROM movies
UNION ALL
SELECT 'reviews 테이블', COUNT(*) FROM reviews
UNION ALL
SELECT 'review_likes 테이블', COUNT(*) FROM review_likes
UNION ALL
SELECT 'comments 테이블', COUNT(*) FROM comments;

-- 6. 샘플 영화 데이터 확인
SELECT 
    id,
    title as '영화제목',
    title_en as '영문제목',
    director as '감독',
    JSON_EXTRACT(genres, '$') as '장르',
    release_date as '개봉일',
    rating as '평점',
    review_count as '리뷰수'
FROM movies;

-- 7. 데이터베이스 전체 통계
SELECT 
    'Total Tables' as 구분,
    COUNT(*) as 개수
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'movie_review_db'
UNION ALL
SELECT 
    'Total Columns',
    COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'movie_review_db'
UNION ALL
SELECT 
    'Foreign Keys',
    COUNT(*)
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'movie_review_db';


