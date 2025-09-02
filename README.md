# 🎬 MovieReview - 영화 리뷰 플랫폼

영화를 사랑하는 사람들이 모여 리뷰를 공유하고 새로운 영화를 발견할 수 있는 완전한 웹 플랫폼입니다.

## 🌟 주요 기능

### 👤 회원 기능
- ✅ 이메일 회원가입 / 로그인
- ✅ JWT 기반 인증 시스템
- ✅ 프로필 관리 (닉네임, 프로필 사진, 선호 장르)
- ✅ 비밀번호 변경

### 🎭 영화 데이터 관리
- ✅ 영화 목록 조회 (페이징, 검색, 필터링)
- ✅ 영화 상세 정보 (포스터, 줄거리, 감독, 배우, 장르, 개봉일 등)
- ✅ 제목, 배우, 감독, 장르별 검색
- ✅ 평점, 개봉일, 리뷰 수 등으로 정렬

### ⭐ 리뷰 시스템
- ✅ 별점 평가 (0.5~5.0점)
- ✅ 텍스트 리뷰 작성
- ✅ 리뷰 이미지 업로드 (최대 3장)
- ✅ 리뷰 수정 / 삭제
- ✅ 리뷰 좋아요 기능
- ✅ 리뷰 댓글 시스템

### 📊 평점 및 통계
- ✅ 영화별 평균 평점 자동 계산
- ✅ 평점 분포 차트
- ✅ 사용자별 리뷰 통계
- ✅ 장르별 선호도 분석

## 🛠 기술 스택

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **MySQL** - 데이터베이스
- **JWT** - 인증 시스템
- **Multer** - 파일 업로드
- **bcryptjs** - 비밀번호 암호화

### Frontend
- **React.js** - UI 라이브러리
- **React Router** - 페이지 라우팅
- **Styled Components** - CSS-in-JS 스타일링
- **Axios** - HTTP 클라이언트
- **React Icons** - 아이콘 라이브러리

## 📁 프로젝트 구조

```
movie/
├── backend/                 # Node.js 백엔드
│   ├── config/             # 데이터베이스 설정
│   ├── middleware/         # 미들웨어 (인증, 파일업로드)
│   ├── routes/             # API 라우트
│   ├── scripts/            # 유틸리티 스크립트
│   ├── uploads/            # 업로드된 파일
│   ├── server.js           # 메인 서버 파일
│   └── package.json
│
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── context/        # React Context (인증)
│   │   ├── utils/          # 유틸리티 (API 클라이언트)
│   │   ├── styles/         # 글로벌 스타일
│   │   └── App.js          # 메인 앱 컴포넌트
│   └── package.json
│
└── README.md
```

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js (v14 이상)
- MySQL (v8.0 이상)
- npm 또는 yarn

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd movie
```

### 2. 백엔드 설정
```bash
cd backend
npm install
```

### 3. 데이터베이스 설정
1. MySQL 서버를 시작합니다
2. `backend/config.env` 파일을 편집하여 데이터베이스 연결 정보를 설정합니다:

```env
PORT=5000
NODE_ENV=development

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=movie_review_db

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex

# 파일 업로드 경로
UPLOAD_PATH=./uploads

# CORS 설정
FRONTEND_URL=http://localhost:3000
```

3. 데이터베이스 초기화:
```bash
npm run init-db
```

### 4. 백엔드 실행
```bash
npm run dev
```
서버가 http://localhost:5000 에서 실행됩니다.

### 5. 프론트엔드 설정 및 실행
새 터미널에서:
```bash
cd frontend
npm install
npm start
```
프론트엔드가 http://localhost:3000 에서 실행됩니다.

## 📚 API 문서

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 조회
- `PUT /api/auth/profile` - 프로필 업데이트
- `PUT /api/auth/password` - 비밀번호 변경

### 영화 API
- `GET /api/movies` - 영화 목록 조회
- `GET /api/movies/:id` - 영화 상세 조회
- `POST /api/movies` - 영화 등록 (관리자)
- `PUT /api/movies/:id` - 영화 수정 (관리자)
- `DELETE /api/movies/:id` - 영화 삭제 (관리자)

### 리뷰 API
- `GET /api/reviews/movie/:movieId` - 특정 영화의 리뷰 목록
- `GET /api/reviews/:id` - 리뷰 상세 조회
- `POST /api/reviews` - 리뷰 작성
- `PUT /api/reviews/:id` - 리뷰 수정
- `DELETE /api/reviews/:id` - 리뷰 삭제
- `POST /api/reviews/:id/like` - 리뷰 좋아요 토글
- `POST /api/reviews/:id/comments` - 댓글 작성
- `DELETE /api/reviews/:reviewId/comments/:commentId` - 댓글 삭제

### 사용자 API
- `GET /api/users/:id` - 사용자 프로필 조회
- `GET /api/users/:id/reviews` - 사용자 리뷰 목록
- `GET /api/users/me/liked-reviews` - 좋아요한 리뷰 목록
- `GET /api/users/:id/stats` - 사용자 통계

## 🎨 UI/UX 특징

- **다크 테마**: 영화 감상에 최적화된 어두운 테마
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **글래스모피즘**: 현대적인 유리 효과 디자인
- **부드러운 애니메이션**: 사용자 경험을 향상시키는 트랜지션
- **직관적인 네비게이션**: 쉽고 빠른 탐색

## 🔒 보안 기능

- JWT 토큰 기반 인증
- 비밀번호 해싱 (bcrypt)
- CORS 보안 설정
- 입력 데이터 검증
- 파일 업로드 보안 (타입 검증, 크기 제한)
- SQL 인젝션 방지

## 📱 주요 페이지

1. **홈페이지** - 플랫폼 소개 및 인기 영화
2. **영화 목록** - 검색, 필터링, 정렬 기능
3. **영화 상세** - 영화 정보 및 리뷰 목록
4. **로그인/회원가입** - 사용자 인증
5. **프로필** - 개인 정보 관리
6. **내 리뷰** - 작성한 리뷰 관리
7. **좋아요한 리뷰** - 좋아요 표시한 리뷰

## 🚧 향후 개발 계획

- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 실시간 알림 시스템
- [ ] 영화 추천 알고리즘
- [ ] 관리자 대시보드
- [ ] 영화 평가 차트 시각화
- [ ] 모바일 앱 (React Native)
- [ ] 영화 데이터 자동 수집 (TMDB API)

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 개발팀

- **Frontend Developer** - React.js, UI/UX 디자인
- **Backend Developer** - Node.js, API 개발
- **Database Designer** - MySQL 스키마 설계

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해주세요.

---

**🎬 MovieReview**로 영화의 새로운 세계를 탐험해보세요!


실행방법 - npm run dev
