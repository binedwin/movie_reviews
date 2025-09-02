require('dotenv').config({ path: './config.env' });
const { testConnection, initializeDatabase } = require('../config/database');

const initDB = async () => {
  console.log('🎬 영화 리뷰 데이터베이스 초기화를 시작합니다...\n');
  
  try {
    // 데이터베이스 연결 테스트
    await testConnection();
    
    // 테이블 생성
    await initializeDatabase();
    
    console.log('\n✅ 데이터베이스 초기화가 완료되었습니다!');
    console.log('📋 생성된 테이블:');
    console.log('  - users (사용자)');
    console.log('  - movies (영화)');
    console.log('  - reviews (리뷰)'); 
    console.log('  - review_likes (리뷰 좋아요)');
    console.log('  - comments (댓글)');
    console.log('\n🚀 이제 서버를 시작할 수 있습니다: npm run dev');
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 오류가 발생했습니다:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('1. MySQL 서버가 실행 중인지 확인');
    console.log('2. config.env 파일의 데이터베이스 설정 확인');
    console.log('3. 데이터베이스 접속 권한 확인');
  }
  
  process.exit(0);
};

initDB();
