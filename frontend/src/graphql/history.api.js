import { gql } from '@apollo/client';

export const MY_INTERACTION_HISTORY = gql`
  query MyInteractionHistory {
    myInteractionHistory {
      likedPosts {
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
      commentedPosts {
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
  }
`;
