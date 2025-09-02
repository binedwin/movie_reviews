import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`;

function UserProfile() {
  return (
    <Container>
      <h1>사용자 프로필</h1>
      <p>다른 사용자의 프로필과 리뷰가 표시됩니다.</p>
      <p>구현 예정...</p>
    </Container>
  );
}

export default UserProfile;


