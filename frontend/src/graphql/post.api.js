import { gql } from '@apollo/client';

export const CREATE_POST = gql`
  mutation CreatePost($content: String!, $categoryTags: [String!]) {
    createPost(content: $content, categoryTags: $categoryTags) {
      id
      content
      createdAt
    }
  }
`;

export const MY_POSTS = gql`
  query GetMyPosts {
    myPosts {
      id
      content
      createdAt
      likeCount
      commentCount
      viewCount
      isLiked
      categoryTags
    }
  }
`;

export const POSTS_BY_IDS = gql`
  query PostsByIds($ids: [ID!]!) {
    postsByIds(ids: $ids) {
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
