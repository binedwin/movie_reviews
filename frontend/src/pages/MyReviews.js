import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiStar, FiEdit, FiTrash2, FiCalendar, FiFilm } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI, usersAPI } from '../utils/api';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  margin-bottom: 32px;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: #888;
    font-size: 1rem;
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ReviewCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  
  .movie-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    
    .movie-link {
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      
      &:hover {
        color: #ff6b6b;
      }
    }
    
    .movie-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .review-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    
    .rating {
      display: flex;
      gap: 2px;
      color: #ffa500;
    }
    
    .date {
      color: #888;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

const ReviewContent = styled.div`
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 1rem;
`;

const ReviewActions = styled.div`
  display: flex;
  gap: 12px;
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: transparent;
    color: #888;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    &.edit {
      &:hover {
        border-color: #4ecdc4;
        color: #4ecdc4;
      }
    }
    
    &.delete {
      &:hover {
        border-color: #ff6b6b;
        color: #ff6b6b;
      }
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #888;
  padding: 80px 20px;
  
  .icon {
    font-size: 4rem;
    color: #444;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 8px;
    color: #aaa;
  }
  
  p {
    margin-bottom: 24px;
    line-height: 1.6;
  }
  
  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #ff6b6b, #ff5252);
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #ff5252, #ff4444);
      transform: translateY(-2px);
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #888;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #ff6b6b;
    margin-bottom: 4px;
  }
  
  .stat-label {
    color: #888;
    font-size: 0.9rem;
  }
`;

function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    totalLikes: 0
  });

  useEffect(() => {
    if (user) {
      fetchMyReviews();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyReviews = async () => {
    try {
      console.log('🔍 사용자 리뷰 조회 시작:', user?.id);
      
      // 사용자의 리뷰 목록 가져오기 - usersAPI 사용
      const response = await usersAPI.getUserReviews(user.id, {
        page: 1,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      console.log('✅ 리뷰 API 응답:', response);
      
      setReviews(response.reviews || []);
      
      // 통계 계산
      if (response.reviews && response.reviews.length > 0) {
        const totalReviews = response.reviews.length;
        const totalRating = response.reviews.reduce((sum, review) => {
          const rating = parseFloat(review.rating) || 0;
          console.log('📊 리뷰 평점:', review.rating, '→', rating);
          return sum + rating;
        }, 0);
        const averageRating = totalRating / totalReviews;
        const totalLikes = response.reviews.reduce((sum, review) => sum + (review.likes_count || 0), 0);
        
        console.log('📊 통계 계산:', { totalRating, totalReviews, averageRating });
        
        setStats({
          totalReviews,
          averageRating: averageRating.toFixed(1),
          totalLikes
        });
      }
    } catch (error) {
      console.error('❌ 내 리뷰 조회 실패:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await reviewsAPI.deleteReview(reviewId);
      // 리뷰 목록에서 제거
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      // 통계 재계산
      fetchMyReviews();
      alert('리뷰가 삭제되었습니다.');
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert('리뷰 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={16}
        style={{ color: i < rating ? '#ffa500' : '#666' }}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Container>
        <EmptyState>
          <div className="icon">
            <FiStar />
          </div>
          <h3>로그인이 필요합니다</h3>
          <p>내 리뷰를 확인하려면 로그인해주세요.</p>
          <Link to="/login" className="cta-button">
            로그인하기
          </Link>
        </EmptyState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <div>리뷰를 불러오는 중...</div>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>내 리뷰</h1>
        <p>{user?.nickname}님이 작성한 리뷰 목록입니다.</p>
      </Header>

      {reviews.length > 0 && (
        <Stats>
          <StatCard>
            <div className="stat-value">{stats.totalReviews}</div>
            <div className="stat-label">작성한 리뷰</div>
          </StatCard>
          <StatCard>
            <div className="stat-value">{stats.averageRating}</div>
            <div className="stat-label">평균 평점</div>
          </StatCard>
          <StatCard>
            <div className="stat-value">{stats.totalLikes}</div>
            <div className="stat-label">받은 좋아요</div>
          </StatCard>
        </Stats>
      )}
      
      {reviews.length > 0 ? (
        <ReviewsList>
          {reviews.map((review) => (
            <ReviewCard key={review.id}>
              <ReviewHeader>
                <div className="movie-info">
                  <div className="movie-title">
                    <FiFilm color="#ff6b6b" />
                    <Link 
                      to={`/movies/${review.movie?.id || review.movie_id}`} 
                      className="movie-link"
                    >
                      {review.movie?.title || `영화 #${review.movie?.id || review.movie_id}`}
                    </Link>
                  </div>
                </div>
                <div className="review-meta">
                  <div className="rating">
                    {renderStars(review.rating)}
                  </div>
                  <div className="date">
                    <FiCalendar size={14} />
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </ReviewHeader>
              
              <ReviewContent>
                {review.content}
              </ReviewContent>
              
              <ReviewActions>
                <button 
                  className="action-btn edit"
                  onClick={() => {
                    // TODO: 리뷰 수정 기능 구현
                    alert('리뷰 수정 기능은 추후 구현 예정입니다.');
                  }}
                >
                  <FiEdit size={14} />
                  수정
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteReview(review.id)}
                >
                  <FiTrash2 size={14} />
                  삭제
                </button>
              </ReviewActions>
            </ReviewCard>
          ))}
        </ReviewsList>
      ) : (
        <EmptyState>
          <div className="icon">
            <FiStar />
          </div>
          <h3>작성한 리뷰가 없습니다</h3>
          <p>
            아직 작성한 리뷰가 없네요.<br />
            좋아하는 영화를 찾아서 첫 리뷰를 작성해보세요!
          </p>
          <Link to="/movies" className="cta-button">
            <FiFilm />
            영화 둘러보기
          </Link>
        </EmptyState>
      )}
    </Container>
  );
}

export default MyReviews;