import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const ProfileCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
`;

function Profile() {
  const { user } = useAuth();

  return (
    <Container>
      <ProfileCard>
        <h1>내 프로필</h1>
        {user && (
          <div>
            <p>닉네임: {user.nickname}</p>
            <p>이메일: {user.email}</p>
            <p>선호 장르: {user.favoriteGenres?.join(', ') || '설정 안함'}</p>
          </div>
        )}
      </ProfileCard>
    </Container>
  );
}

export default Profile;
