import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiStar, FiArrowLeft, FiCalendar, FiClock, FiUser, FiHeart, FiMessageCircle, FiEdit3 } from 'react-icons/fi';
import { moviesAPI, reviewsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DetailContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ff6b6b;
  text-decoration: none;
  margin-bottom: 20px;
  font-weight: 500;
  
  &:hover {
    color: #ff5252;
  }
`;

const MovieHeader = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const MoviePoster = styled.div`
  width: 100%;
  height: 450px;
  background: ${props => props.poster 
    ? `url(${props.poster}) center/cover` 
    : 'linear-gradient(135deg, #333, #555)'};
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const MovieInfo = styled.div`
  color: white;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title-en {
    color: #888;
    font-size: 1.2rem;
    margin-bottom: 16px;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    
    .stars {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ffa500;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .count {
      color: #888;
      font-size: 0.9rem;
    }
  }
  
  .details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #bbb;
      font-size: 0.9rem;
      
      svg {
        color: #ff6b6b;
      }
    }
  }
  
  .genres {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    
    .genre-tag {
      background: rgba(255, 107, 107, 0.2);
      color: #ff6b6b;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      border: 1px solid rgba(255, 107, 107, 0.3);
    }
  }
  
  .description {
    color: #ccc;
    line-height: 1.6;
    font-size: 1rem;
  }
`;

const ReviewsSection = styled.div`
  margin-top: 40px;
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WriteReviewButton = styled.button`
  background: linear-gradient(135deg, #ff6b6b, #ff5252);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  
  &:hover {
    background: linear-gradient(135deg, #ff5252, #ff4444);
    transform: translateY(-2px);
  }
`;

const ReviewForm = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      color: white;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .rating-input {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
      
      .star {
        cursor: pointer;
        color: #666;
        font-size: 1.5rem;
        transition: color 0.2s;
        
        &.active {
          color: #ffa500;
        }
        
        &:hover {
          color: #ffa500;
        }
      }
    }
    
    textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 1rem;
      resize: vertical;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      &:focus {
        outline: none;
        border-color: #ff6b6b;
      }
    }
    
    .form-actions {
      display: flex;
      gap: 12px;
      
      button {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.submit {
          background: linear-gradient(135deg, #ff6b6b, #ff5252);
          color: white;
          border: none;
          
          &:hover {
            background: linear-gradient(135deg, #ff5252, #ff4444);
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
        
        &.cancel {
          background: transparent;
          color: #888;
          border: 1px solid #444;
          
          &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }
        }
      }
    }
  }
`;

const ReviewsList = styled.div`
  .empty-state {
    text-align: center;
    color: #888;
    padding: 60px 20px;
    
    h3 {
      margin-bottom: 8px;
      color: #aaa;
    }
  }
`;

const ReviewCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .avatar {
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
        .nickname {
          color: white;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .date {
          color: #888;
          font-size: 0.8rem;
        }
      }
    }
    
    .review-rating {
      display: flex;
      gap: 2px;
      color: #ffa500;
    }
  }
  
  .review-content {
    color: #ccc;
    line-height: 1.6;
    margin-bottom: 12px;
  }
  
  .review-actions {
    display: flex;
    gap: 16px;
    color: #888;
    font-size: 0.9rem;
    
    .action {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: color 0.3s;
      
      &:hover {
        color: #ff6b6b;
      }
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

function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchMovieDetail();
    fetchReviews();
  }, [id]);

  const fetchMovieDetail = async () => {
    try {
      console.log('🎬 영화 상세 정보 요청:', id);
      const response = await moviesAPI.getMovie(id);
      console.log('✅ 영화 상세 API 응답:', response);
      setMovie(response);
    } catch (error) {
      console.error('❌ 영화 정보 로딩 실패:', error);
      console.error('❌ 오류 상세:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      console.log('📝 영화 리뷰 요청:', id);
      const response = await reviewsAPI.getMovieReviews(id, {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      console.log('✅ 리뷰 API 응답:', response);
      console.log('📊 리뷰 개수:', response.reviews?.length);
      setReviews(response.reviews || []);
      
      // 사용자가 이미 리뷰를 작성했는지 확인
      if (user && response.reviews) {
        const userReview = response.reviews.find(review => review.user_id === user.id);
        setUserHasReviewed(!!userReview);
        console.log('🔍 사용자 리뷰 확인:', userReview ? '이미 작성함' : '미작성');
      }
    } catch (error) {
      console.error('❌ 리뷰 로딩 실패:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setReviewForm(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    if (!reviewForm.rating || !reviewForm.content.trim()) {
      alert('평점과 리뷰 내용을 모두 입력해주세요.');
      return;
    }

    console.log('🔑 현재 사용자:', user);
    setSubmitting(true);
    try {
      console.log('📝 리뷰 작성 요청:', {
        movieId: parseInt(id),
        rating: reviewForm.rating,
        content: reviewForm.content.trim()
      });
      
      await reviewsAPI.createReview({
        movieId: parseInt(id),
        rating: reviewForm.rating,
        content: reviewForm.content.trim()
      });
      
      console.log('✅ 리뷰 작성 성공');
      
      // 폼 초기화
      setReviewForm({ rating: 0, content: '' });
      setShowReviewForm(false);
      setUserHasReviewed(true); // 리뷰 작성 완료 상태로 변경
      
      // 리뷰 목록 새로고침
      fetchReviews();
      
      alert('리뷰가 성공적으로 작성되었습니다!');
    } catch (error) {
      console.error('❌ 리뷰 작성 실패:', error);
      console.error('❌ 오류 상세:', error.response?.data);
      console.error('❌ 응답 상태:', error.response?.status);
      console.error('❌ 요청 데이터:', error.config?.data);
      
      const errorMessage = error.response?.data?.message || '리뷰 작성에 실패했습니다. 다시 시도해주세요.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating, interactive = false, size = 16) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={size}
        className={interactive ? 'star' : ''}
        style={{
          color: i < rating ? '#ffa500' : '#666',
          cursor: interactive ? 'pointer' : 'default'
        }}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ));
  };

  if (loading) {
    return (
      <DetailContainer>
        <LoadingContainer>
          <div>영화 정보를 불러오는 중...</div>
        </LoadingContainer>
      </DetailContainer>
    );
  }

  if (!movie) {
    return (
      <DetailContainer>
        <LoadingContainer>
          <div>영화를 찾을 수 없습니다.</div>
        </LoadingContainer>
      </DetailContainer>
    );
  }

  return (
    <DetailContainer>
      <BackButton to="/movies">
        <FiArrowLeft /> 영화 목록으로 돌아가기
      </BackButton>

      <MovieHeader>
        <MoviePoster poster={movie.poster_url} />
        <MovieInfo>
          <h1>{movie.title}</h1>
          {movie.title_en && <div className="title-en">{movie.title_en}</div>}
          
          <div className="rating">
            <div className="stars">
              {renderStars(Math.round(movie.rating))}
              <span>{movie.rating}</span>
            </div>
            <div className="count">({movie.review_count}개 리뷰)</div>
          </div>
          
          <div className="details">
            <div className="detail-item">
              <FiCalendar />
              <span>{formatDate(movie.release_date)}</span>
            </div>
            <div className="detail-item">
              <FiClock />
              <span>{movie.runtime}분</span>
            </div>
            <div className="detail-item">
              <FiUser />
              <span>{movie.director}</span>
            </div>
          </div>
          
          <div className="genres">
            {movie.genres?.map((genre, index) => (
              <span key={index} className="genre-tag">{genre}</span>
            ))}
          </div>
          
          <div className="description">
            {movie.description}
          </div>
        </MovieInfo>
      </MovieHeader>

      <ReviewsSection>
        <SectionTitle>
          <FiMessageCircle />
          리뷰 ({reviews.length})
        </SectionTitle>

        {user && (
          <>
            {userHasReviewed ? (
              <div style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#888',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                이미 이 영화에 대한 리뷰를 작성하셨습니다.
              </div>
            ) : !showReviewForm ? (
              <WriteReviewButton onClick={() => setShowReviewForm(true)}>
                <FiEdit3 />
                리뷰 작성하기
              </WriteReviewButton>
            ) : (
              <ReviewForm>
                <div className="form-group">
                  <label>평점</label>
                  <div className="rating-input">
                    {renderStars(reviewForm.rating, true, 24)}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>리뷰 내용</label>
                  <textarea
                    placeholder="이 영화에 대한 솔직한 감상을 남겨주세요..."
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                
                <div className="form-group">
                  <div className="form-actions">
                    <button 
                      className="submit" 
                      onClick={handleSubmitReview}
                      disabled={submitting}
                    >
                      {submitting ? '작성 중...' : '리뷰 등록'}
                    </button>
                    <button 
                      className="cancel" 
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewForm({ rating: 0, content: '' });
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </ReviewForm>
            )}
          </>
        )}

        <ReviewsList>
          {reviewsLoading ? (
            <LoadingContainer>
              <div>리뷰를 불러오는 중...</div>
            </LoadingContainer>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard key={review.id}>
                <div className="review-header">
                  <div className="user-info">
                    <div className="avatar">
                      {review.nickname?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                      <div className="nickname">{review.nickname || '익명'}</div>
                      <div className="date">{formatDate(review.created_at)}</div>
                    </div>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className="review-content">
                  {review.content}
                </div>
                <div className="review-actions">
                  <div className="action">
                    <FiHeart />
                    <span>{review.likes_count || 0}</span>
                  </div>
                </div>
              </ReviewCard>
            ))
          ) : (
            <div className="empty-state">
              <h3>아직 리뷰가 없습니다</h3>
              <p>첫 번째 리뷰를 작성해보세요!</p>
            </div>
          )}
        </ReviewsList>
      </ReviewsSection>
    </DetailContainer>
  );
}

export default MovieDetail;