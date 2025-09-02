import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiSearch, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  padding: 0 20px;
  height: 80px;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 80px;
    left: ${props => props.isOpen ? '0' : '-100%'};
    width: 100%;
    height: calc(100vh - 80px);
    background: rgba(26, 26, 46, 0.98);
    backdrop-filter: blur(20px);
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 40px;
    transition: left 0.3s ease;
  }
`;

const NavLink = styled(Link)`
  color: #e0e0e0;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
  
  &.active {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.2);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 90%;
    margin-bottom: 20px;
  }
`;

const SearchInput = styled.input`
  background: none;
  border: none;
  color: white;
  width: 100%;
  padding: 4px 8px;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserButton = styled.button`
  background: none;
  border: none;
  color: #e0e0e0;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
`;

const ProfileImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff6b6b;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 0;
  min-width: 180px;
  margin-top: 8px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '-10px'});
  transition: all 0.3s ease;
  z-index: 1001;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #e0e0e0;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  }
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #e0e0e0;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const AuthButton = styled(Link)`
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &.login {
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  }
  
  &.register {
    background: linear-gradient(135deg, #ff6b6b, #ff5252);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #ff5252, #ff4444);
    }
  }
`;

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">
          🎬 <span>MovieReview</span>
        </Logo>

        <NavLinks isOpen={isMenuOpen}>
          <SearchContainer>
            <FiSearch size={16} color="#888" />
            <form onSubmit={handleSearch} style={{ width: '100%' }}>
              <SearchInput
                type="text"
                placeholder="영화 제목, 배우, 감독으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </SearchContainer>

          <NavLink 
            to="/movies" 
            className={isActivePath('/movies') ? 'active' : ''}
            onClick={closeMobileMenu}
          >
            영화 목록
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink 
                to="/my-reviews" 
                className={isActivePath('/my-reviews') ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                내 리뷰
              </NavLink>
              <NavLink 
                to="/liked-reviews" 
                className={isActivePath('/liked-reviews') ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                좋아요한 리뷰
              </NavLink>
            </>
          )}
        </NavLinks>

        <UserMenu>
          {isAuthenticated ? (
            <>
              <UserButton 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              >
                {user?.profileImage ? (
                  <ProfileImage src={user.profileImage} alt={user.nickname} />
                ) : (
                  <FiUser size={20} />
                )}
                <span>{user?.nickname}</span>
              </UserButton>
              
              <DropdownMenu isOpen={isDropdownOpen}>
                <DropdownItem to="/profile" onClick={() => setIsDropdownOpen(false)}>
                  <FiUser size={16} />
                  프로필
                </DropdownItem>
                <DropdownButton onClick={handleLogout}>
                  <FiLogOut size={16} />
                  로그아웃
                </DropdownButton>
              </DropdownMenu>
            </>
          ) : (
            <AuthButtons>
              <AuthButton to="/login" className="login">
                로그인
              </AuthButton>
              <AuthButton to="/register" className="register">
                회원가입
              </AuthButton>
            </AuthButtons>
          )}

          <MobileMenuButton onClick={toggleMobileMenu}>
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </MobileMenuButton>
        </UserMenu>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;


