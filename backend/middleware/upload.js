const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 확인 및 생성
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    if (file.fieldname === 'profileImage') {
      uploadPath = path.join(__dirname, '../uploads/profiles');
    } else if (file.fieldname === 'reviewImages') {
      uploadPath = path.join(__dirname, '../uploads/reviews');
    } else {
      uploadPath = path.join(__dirname, '../uploads/misc');
    }
    
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 파일명: 타임스탬프_랜덤숫자.확장자
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (JPEG, PNG, GIF, WebP)'), false);
  }
};

// 업로드 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
    files: 5 // 최대 5개 파일
  }
});

// 프로필 이미지 업로드 (단일 파일)
const uploadProfileImage = upload.single('profileImage');

// 리뷰 이미지 업로드 (다중 파일, 최대 3개)
const uploadReviewImages = upload.array('reviewImages', 3);

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '파일 크기는 5MB를 초과할 수 없습니다.' });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '최대 3개의 이미지만 업로드할 수 있습니다.' });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: '예상하지 못한 필드입니다.' });
    }
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadProfileImage,
  uploadReviewImages,
  handleUploadError
};


