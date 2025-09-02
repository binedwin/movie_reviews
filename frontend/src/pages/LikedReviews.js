import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FiStar, FiHeart, FiMessageCircle, FiFilm, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../utils/api';

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
    color: #666;
    font-size: 1.1rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff6b6b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ReviewCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
  }
  
  .user-details {
    h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
    }
    
    .movie-link {
      color: #666;
      text-decoration: none;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &:hover {
        color: #ff6b6b;
      }
    }
  }
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
  color: #888;
  
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ffa500;
    font-weight: 600;
  }
  
  .created-at {
    color: #999;
  }
`;

const ReviewContent = styled.div`
  margin: 16px 0;
  
  p {
    font-size: 1rem;
    line-height: 1.6;
    color: #333;
    margin: 0;
  }
`;

const ReviewActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
    font-size: 0.9rem;
    cursor: pointer;
    
    &:hover {
      color: #ff6b6b;
    }
    
    &.liked {
      color: #ff6b6b;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  
  button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      background: #f8f9fa;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.active {
      background: #ff6b6b;
      color: white;
      border-color: #ff6b6b;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #888;
  padding: 80px 20px;
  
  h3 {
    margin-bottom: 12px;
    color: #666;
  }
  
  p {
    margin-bottom: 8px;
  }
  
  .browse-link {
    color: #ff6b6b;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

function AllReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAllReviews = async (page = 1) => {
    try {
      setLoading(true);
      console.log('📝 모든 리뷰 조회 시작:', page);
      
      const params = {
        page: page,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
      
      const response = await reviewsAPI.getAllReviews(params);
      console.log('🔍 전체 응답:', response);
      console.log('🔍 response.data:', response.data);
      console.log('🔍 response.data 타입:', typeof response.data);
      console.log('✅ 모든 리뷰 조회 성공:', response.data);
      
      console.log('🔄 setReviews 호출 전 reviews:', reviews);
      
      // 응답 구조 확인 및 안전한 처리
      const data = response.data || response;
      console.log('🔄 처리할 데이터:', data);
      console.log('🔄 설정할 새 reviews:', data.reviews);
      
      if (data && data.reviews) {
        setReviews(data.reviews);
        setPagination(data.pagination || {});
      } else {
        console.error('❌ 잘못된 응답 구조:', data);
        setReviews([]);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ 모든 리뷰 조회 실패:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      console.error('❌ 오류 상태:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <h1>모든 리뷰</h1>
          <p>다른 사용자들이 작성한 모든 영화 리뷰를 확인해보세요!</p>
        </Header>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>모든 리뷰</h1>
        <p>다른 사용자들이 작성한 모든 영화 리뷰를 확인해보세요! 📝✨</p>
      </Header>

      {console.log('📊 렌더링 시점 reviews.length:', reviews.length, 'reviews:', reviews)}
      {reviews.length === 0 ? (
        <EmptyState>
          <h3>아직 작성된 리뷰가 없습니다</h3>
          <p>첫 번째 리뷰를 작성해보세요!</p>
          <Link to="/movies" className="browse-link">
            영화 둘러보기 →
          </Link>
        </EmptyState>
      ) : (
        <>
          <ReviewsList>
            {reviews.map(review => (
              <ReviewCard key={review.id}>
                <ReviewHeader>
                  <UserInfo>
                    <div className="user-avatar">
                      {review.user?.profileImage ? (
                        <img src={review.user.profileImage} alt="프로필" />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <div className="user-details">
                      <h4>{review.user?.nickname || '익명'}</h4>
                      <Link 
                        to={`/movies/${review.movie?.id}`} 
                        className="movie-link"
                      >
                        <FiFilm size={14} />
                        {review.movie?.title}
                      </Link>
                    </div>
                  </UserInfo>
                  
                  <ReviewMeta>
                    <div className="rating">
                      <FiStar fill="currentColor" />
                      {review.rating}
                    </div>
                    <div className="created-at">
                      {formatDate(review.createdAt)}
                    </div>
                  </ReviewMeta>
                </ReviewHeader>

                <ReviewContent>
                  {console.log('🔍 렌더링 중인 리뷰:', review.id, 'content:', review.content)}
                  <p>{review.content}</p>
                </ReviewContent>

                <ReviewActions>
                  <div className={`action-btn ${review.isLiked ? 'liked' : ''}`}>
                    <FiHeart fill={review.isLiked ? 'currentColor' : 'none'} />
                    {review.likesCount}
                  </div>
                  <div className="action-btn">
                    <FiMessageCircle />
                    {review.commentsCount}
                  </div>
                </ReviewActions>
              </ReviewCard>
            ))}
          </ReviewsList>

          {pagination.totalPages > 1 && (
            <Pagination>
              <button 
                onClick={() => fetchAllReviews(currentPage - 1)}
                disabled={currentPage === 1}
              >
                이전
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchAllReviews(page)}
                  className={currentPage === page ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => fetchAllReviews(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                다음
              </button>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}

export default AllReviews;
