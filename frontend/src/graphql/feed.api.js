import { gql } from '@apollo/client';

export const MY_FEED = gql`
  query GetMyFeed {
    myFeed {
      id
      content
      createdAt
      likeCount
      commentCount
      viewCount
      isLiked
      categoryTags
      user {
        id
        email
      }
    }
  }
`;
