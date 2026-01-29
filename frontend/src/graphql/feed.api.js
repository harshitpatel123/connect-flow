import { gql } from '@apollo/client';

export const MY_FEED = gql`
  query GetMyFeed {
    myFeed {
      postId
    }
  }
`;
