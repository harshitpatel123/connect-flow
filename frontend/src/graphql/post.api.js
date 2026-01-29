import { gql } from '@apollo/client';

export const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
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
    }
  }
`;

export const POSTS_BY_IDS = gql`
  query PostsByIds($ids: [ID!]!) {
    postsByIds(ids: $ids) {
      id
      content
      createdAt
      user {
        id
        email
      }
    }
  }
`;
