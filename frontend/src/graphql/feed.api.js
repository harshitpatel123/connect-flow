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

export const REGENERATE_FEED = gql`
  mutation RegenerateFeed {
    regenerateFeed {
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
