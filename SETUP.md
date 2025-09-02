# 🚀 MovieReview 설치 가이드

이 가이드를 따라 영화 리뷰 플랫폼을 설치하고 실행해보세요.

## 📋 사전 준비사항

다음 소프트웨어들이 설치되어 있어야 합니다:

1. **Node.js** (v14 이상)
   ```bash
   node --version
   npm --version
   ```

2. **MySQL** (v8.0 이상)
   - MySQL 서버가 실행 중이어야 합니다
   - 데이터베이스 생성 권한이 있는 계정이 필요합니다

## 🛠 설치 단계

### 1단계: 프로젝트 설정
```bash
# 프로젝트 폴더로 이동
cd /Users/edwin/movie

# 모든 의존성 패키지 설치
npm run install-all
```

### 2단계: 데이터베이스 설정
1. MySQL에 접속하여 데이터베이스를 생성합니다:
```sql
CREATE DATABASE movie_review_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. `backend/config.env` 파일을 수정합니다:
```env
PORT=5000
NODE_ENV=development

# 데이터베이스 설정 (실제 값으로 변경하세요)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=movie_review_db

# JWT 설정 (보안을 위해 복잡한 키로 변경하세요)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex

# 파일 업로드 경로
UPLOAD_PATH=./uploads

# CORS 설정
FRONTEND_URL=http://localhost:3000
```

### 3단계: 데이터베이스 초기화
```bash
cd backend
npm run init-db
```

성공 시 다음과 같은 메시지가 표시됩니다:
```
✅ MySQL 데이터베이스 연결 성공
✅ 데이터베이스 테이블 초기화 완료
📋 생성된 테이블:
  - users (사용자)
  - movies (영화)
  - reviews (리뷰)
  - review_likes (리뷰 좋아요)
  - comments (댓글)
```

### 4단계: 개발 서버 실행
프로젝트 루트 폴더에서:
```bash
npm run dev
```

이 명령어는 백엔드와 프론트엔드를 동시에 실행합니다:
- 백엔드: http://localhost:5000
- 프론트엔드: http://localhost:3000

## 🔧 개별 실행

필요한 경우 백엔드와 프론트엔드를 개별적으로 실행할 수 있습니다:

### 백엔드만 실행
```bash
cd backend
npm run dev
```

### 프론트엔드만 실행
```bash
cd frontend
npm start
```

## 🎯 테스트

설치가 완료되면 다음 기능들을 테스트해보세요:

1. **회원가입** (http://localhost:3000/register)
   - 이메일, 닉네임, 비밀번호 입력
   - 선호 장르 선택

2. **로그인** (http://localhost:3000/login)
   - 생성한 계정으로 로그인

3. **영화 목록** (http://localhost:3000/movies)
   - 영화 검색 및 필터링

4. **영화 등록** (관리자 기능)
   - API 도구(Postman)를 사용하여 테스트

## 🐛 문제 해결

### MySQL 연결 오류
```
❌ MySQL 연결 실패: Access denied for user
```
**해결방법**: `backend/config.env`의 데이터베이스 설정을 확인하세요.

### 포트 충돌 오류
```
Error: listen EADDRINUSE: address already in use :::5000
```
**해결방법**: 다른 프로세스가 포트를 사용 중입니다. 프로세스를 종료하거나 다른 포트를 사용하세요.

### Node.js 버전 오류
```
Error: The engine "node" is incompatible
```
**해결방법**: Node.js를 v14 이상으로 업데이트하세요.

## 📊 샘플 데이터 추가

시스템을 테스트하기 위해 샘플 영화 데이터를 추가할 수 있습니다:

```bash
# 백엔드 서버가 실행 중인 상태에서
curl -X POST http://localhost:5000/api/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "아바타",
    "titleEn": "Avatar",
    "description": "판도라 행성을 배경으로 한 SF 영화",
    "director": "제임스 카메론",
    "actors": "샘 워딩턴, 조 샐다나",
    "genres": ["SF", "액션", "모험"],
    "releaseDate": "2009-12-18",
    "runtime": 162
  }'
```

## 🔐 보안 설정

운영 환경에서는 다음 사항들을 반드시 변경하세요:

1. **JWT_SECRET**: 강력한 랜덤 키로 변경
2. **데이터베이스 비밀번호**: 복잡한 비밀번호 사용
3. **NODE_ENV**: `production`으로 설정
4. **CORS 설정**: 실제 도메인으로 제한

## 📚 추가 정보

- [API 문서](README.md#-api-문서)
- [프로젝트 구조](README.md#-프로젝트-구조)
- [기술 스택](README.md#-기술-스택)

설치 중 문제가 발생하면 GitHub 이슈를 생성해주세요! 🤝


