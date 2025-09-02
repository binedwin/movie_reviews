import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiStar, FiTrendingUp, FiClock, FiArrowRight } from 'react-icons/fi';
import { moviesAPI } from '../utils/api';

const HomeContainer = styled.div`
  min-height: 100vh;
`;

const HeroSection = styled.section`
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(22, 33, 62, 0.9)),
              url('https://images.unsplash.com/photo-1489599577372-f4f4e7eaeb83?ixlib=rb-4.0.3') center/cover;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const HeroContent = styled.div`
  max-width: 800px;
  padding: 0 20px;
  z-index: 2;
  
  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #fff, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }
  
  p {
    font-size: 1.2rem;
    color: #e0e0e0;
    margin-bottom: 32px;
    line-height: 1.6;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #ff6b6b, #ff5252);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(255, 107, 107, 0.4);
    background: linear-gradient(135deg, #ff5252, #ff4444);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 48px;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-bottom: 80px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 107, 107, 0.3);
  }
  
  .icon {
    background: linear-gradient(135deg, #ff6b6b, #ff5252);
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    color: white;
    font-size: 24px;
  }
  
  h3 {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #ff6b6b;
  }
  
  p {
    color: #b0b0b0;
    line-height: 1.6;
  }
`;

const MoviesSection = styled.section`
  background: rgba(255, 255, 255, 0.05);
  padding: 80px 20px;
`;

const MoviesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const MoviesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const MovieCard = styled(Link)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 107, 107, 0.3);
  }
`;

const MoviePoster = styled.div`
  width: 100%;
  height: 280px;
  background: ${props => props.poster 
    ? `url(${props.poster}) center/cover` 
    : 'linear-gradient(135deg, #333, #555)'};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  }
`;

const MovieInfo = styled.div`
  padding: 16px;
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: white;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ffa500;
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  
  .genre {
    color: #888;
    font-size: 0.8rem;
  }
`;

const ViewAllButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
  transition: all 0.3s ease;
  margin: 0 auto;
  max-width: 200px;
  
  &:hover {
    background: rgba(255, 107, 107, 0.2);
    border-color: rgba(255, 107, 107, 0.3);
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-left: 4px solid #ff6b6b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function Home() {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovies = async () => {
      try {
        console.log('🎬 영화 데이터 요청 시작...');
        const response = await moviesAPI.getMovies({
          sortBy: 'rating',
          sortOrder: 'desc',
          limit: 8,
          page: 1
        });
        console.log('✅ API 응답 받음:', response);
        console.log('🎭 영화 개수:', response.movies?.length);
        setFeaturedMovies(response.movies);
      } catch (error) {
        console.error('❌ 영화 데이터 로딩 실패:', error);
        console.error('❌ 오류 상세:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovies();
  }, []);

  const features = [
    {
      icon: <FiStar />,
      title: '솔직한 리뷰',
      description: '실제 관객들의 솔직하고 자세한 영화 리뷰를 확인하고 나만의 리뷰도 작성해보세요.'
    },
    {
      icon: <FiTrendingUp />,
      title: '인기 영화 추천',
      description: '평점과 리뷰를 바탕으로 한 인기 영화들을 발견하고 여러분만의 취향을 찾아보세요.'
    },
    {
      icon: <FiClock />,
      title: '최신 영화 정보',
      description: '최근 개봉한 영화부터 클래식까지, 다양한 영화 정보를 한눈에 확인할 수 있습니다.'
    }
  ];

  return (
    <HomeContainer>
      <HeroSection>
        <HeroContent>
          <h1>영화의 모든 순간을 함께</h1>
          <p>
            영화를 사랑하는 사람들이 모여 리뷰를 나누고, 
            새로운 작품을 발견하는 특별한 공간입니다.
          </p>
          <CTAButton to="/movies">
            영화 탐색하기 <FiArrowRight />
          </CTAButton>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>MovieReview의 특별함</SectionTitle>
        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <div className="icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesSection>

      <MoviesSection>
        <MoviesContainer>
          <SectionTitle>높은 평점의 영화들</SectionTitle>
          
          {loading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : (
            <>
              {/* 디버깅 정보 */}
              {console.log('🎬 렌더링 중 featuredMovies:', featuredMovies)}
              {console.log('🎬 featuredMovies 타입:', typeof featuredMovies)}
              {console.log('🎬 featuredMovies 배열 여부:', Array.isArray(featuredMovies))}
              
              {featuredMovies && featuredMovies.length > 0 ? (
                <>
                  <MoviesGrid>
                    {featuredMovies.map((movie) => (
                      <MovieCard key={movie.id} to={`/movies/${movie.id}`}>
                        <MoviePoster poster={movie.poster_url} />
                        <MovieInfo>
                          <h3>{movie.title}</h3>
                          <div className="rating">
                            <FiStar size={14} />
                            <span>{movie.rating || 0}</span>
                            <span>({movie.review_count || 0})</span>
                          </div>
                          <div className="genre">
                            {movie.genres?.slice(0, 2).join(', ')}
                          </div>
                        </MovieInfo>
                      </MovieCard>
                    ))}
                  </MoviesGrid>
                  
                  <ViewAllButton to="/movies">
                    모든 영화 보기 <FiArrowRight />
                  </ViewAllButton>
                </>
              ) : (
                <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                  영화 데이터를 불러오는 중이거나 데이터가 없습니다.
                  <br />
                  featuredMovies: {JSON.stringify(featuredMovies)}
                </div>
              )}
            </>
          )}
        </MoviesContainer>
      </MoviesSection>
    </HomeContainer>
  );
}

export default Home;
