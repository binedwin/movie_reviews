import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiStar, FiFilter, FiSearch } from 'react-icons/fi';
import { moviesAPI } from '../utils/api';

const MovieListContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  margin-bottom: 40px;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: #b0b0b0;
    font-size: 1.1rem;
  }
`;

const FilterSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterControls = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchGroup = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    &:focus {
      outline: none;
      border-color: #ff6b6b;
    }
  }
  
  .icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #ff6b6b;
  }
  
  option {
    background: #1a1a2e;
    color: white;
  }
`;

const ApplyButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff6b6b, #ff5252);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: linear-gradient(135deg, #ff5252, #ff4444);
  }
`;

const ResultsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: #b0b0b0;
`;

const MoviesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
  height: 300px;
  background: ${props => props.poster 
    ? `url(${props.poster}) center/cover` 
    : 'linear-gradient(135deg, #333, #555)'};
  position: relative;
`;

const MovieInfo = styled.div`
  padding: 16px;
  
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 8px;
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
    margin-bottom: 8px;
  }
  
  .genre {
    color: #888;
    font-size: 0.85rem;
    margin-bottom: 8px;
  }
  
  .release-date {
    color: #666;
    font-size: 0.8rem;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.active ? '#ff6b6b' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid ${props => props.active ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 107, 107, 0.3);
    border-color: #ff6b6b;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
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

const genres = [
  '액션', '드라마', '코미디', '로맨스', '스릴러', 'SF', 
  '판타지', '공포', '범죄', '모험', '애니메이션', '다큐멘터리'
];

function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    genre: searchParams.get('genre') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const fetchMovies = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        ...filters
      };
      
      // 빈 값 제거
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await moviesAPI.getMovies(params);
      setMovies(response.movies);
      setPagination(response.pagination);
    } catch (error) {
      console.error('영화 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    fetchMovies(1);
  };

  const handlePageChange = (page) => {
    fetchMovies(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <MovieListContainer>
      <Header>
        <h1>영화 목록</h1>
        <p>다양한 영화들을 탐색하고 리뷰를 확인해보세요</p>
      </Header>

      <FilterSection>
        <FilterControls>
          <SearchGroup>
            <FiSearch className="icon" size={20} />
            <input
              type="text"
              placeholder="영화 제목, 배우, 감독으로 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
          </SearchGroup>
          
          <Select
            value={filters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="">모든 장르</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </Select>
          
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
          >
            <option value="created_at-desc">최신순</option>
            <option value="rating-desc">평점 높은순</option>
            <option value="rating-asc">평점 낮은순</option>
            <option value="title-asc">제목순</option>
            <option value="release_date-desc">개봉일 최신순</option>
            <option value="review_count-desc">리뷰 많은순</option>
          </Select>
        </FilterControls>
        
        <ApplyButton onClick={applyFilters}>
          <FiFilter size={16} />
          적용
        </ApplyButton>
      </FilterSection>

      {!loading && (
        <ResultsInfo>
          <span>총 {pagination.totalItems || 0}개의 영화</span>
          <span>
            {pagination.currentPage || 1} / {pagination.totalPages || 1} 페이지
          </span>
        </ResultsInfo>
      )}

      {loading ? (
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      ) : (
        <>
          <MoviesGrid>
            {movies.map((movie) => (
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
                  <div className="release-date">
                    {formatDate(movie.release_date)}
                  </div>
                </MovieInfo>
              </MovieCard>
            ))}
          </MoviesGrid>

          {pagination.totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                이전
              </PageButton>
              
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <PageButton
                    key={page}
                    active={page === pagination.currentPage}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PageButton>
                );
              })}
              
              <PageButton
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                다음
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </MovieListContainer>
  );
}

export default MovieList;
