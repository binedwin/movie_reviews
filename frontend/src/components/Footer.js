import React from 'react';
import styled from 'styled-components';
import { FiHeart, FiGithub, FiMail, FiInstagram } from 'react-icons/fi';

const FooterContainer = styled.footer`
  background: rgba(15, 15, 30, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px 20px 20px;
  margin-top: 80px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }
`;

const FooterSection = styled.div`
  h3 {
    color: #ff6b6b;
    font-size: 18px;
    margin-bottom: 16px;
    font-weight: 600;
  }
  
  p, a {
    color: #b0b0b0;
    line-height: 1.6;
    margin-bottom: 8px;
    text-decoration: none;
    transition: color 0.3s ease;
  }
  
  a:hover {
    color: #ff6b6b;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #b0b0b0;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
    transform: translateY(-2px);
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  margin-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #888;
  font-size: 14px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
`;

const MadeWithLove = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b0b0b0;
  
  .heart {
    color: #ff6b6b;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const QuickLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuickLink = styled.a`
  color: #b0b0b0;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: #ff6b6b;
  }
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <h3>🎬 MovieReview</h3>
          <p>
            영화를 사랑하는 사람들이 모여 리뷰를 공유하고 
            새로운 영화를 발견할 수 있는 플랫폼입니다.
          </p>
          <p>
            여러분의 솔직한 리뷰가 다른 사용자들에게 
            큰 도움이 됩니다.
          </p>
          <SocialLinks>
            <SocialLink href="#" aria-label="GitHub">
              <FiGithub size={20} />
            </SocialLink>
            <SocialLink href="#" aria-label="Instagram">
              <FiInstagram size={20} />
            </SocialLink>
            <SocialLink href="#" aria-label="Email">
              <FiMail size={20} />
            </SocialLink>
          </SocialLinks>
        </FooterSection>

        <FooterSection>
          <h3>빠른 링크</h3>
          <QuickLinks>
            <QuickLink href="/movies">인기 영화</QuickLink>
            <QuickLink href="/movies?sortBy=release_date&sortOrder=desc">최신 영화</QuickLink>
            <QuickLink href="/movies?sortBy=rating&sortOrder=desc">높은 평점</QuickLink>
            <QuickLink href="/movies?sortBy=review_count&sortOrder=desc">리뷰 많은 영화</QuickLink>
          </QuickLinks>
        </FooterSection>

        <FooterSection>
          <h3>장르별 탐색</h3>
          <QuickLinks>
            <QuickLink href="/movies?genre=액션">액션</QuickLink>
            <QuickLink href="/movies?genre=드라마">드라마</QuickLink>
            <QuickLink href="/movies?genre=코미디">코미디</QuickLink>
            <QuickLink href="/movies?genre=로맨스">로맨스</QuickLink>
            <QuickLink href="/movies?genre=스릴러">스릴러</QuickLink>
            <QuickLink href="/movies?genre=SF">SF</QuickLink>
          </QuickLinks>
        </FooterSection>

        <FooterSection>
          <h3>고객 지원</h3>
          <QuickLinks>
            <QuickLink href="#">자주 묻는 질문</QuickLink>
            <QuickLink href="#">이용약관</QuickLink>
            <QuickLink href="#">개인정보처리방침</QuickLink>
            <QuickLink href="#">문의하기</QuickLink>
            <QuickLink href="#">신고하기</QuickLink>
          </QuickLinks>
        </FooterSection>
      </FooterContent>

      <FooterBottom>
        <div>
          &copy; 2024 MovieReview. All rights reserved.
        </div>
        <MadeWithLove>
          Made with <FiHeart className="heart" size={16} /> for movie lovers
        </MadeWithLove>
      </FooterBottom>
    </FooterContainer>
  );
}

export default Footer;


