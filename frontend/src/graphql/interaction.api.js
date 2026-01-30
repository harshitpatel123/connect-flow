import { gql } from '@apollo/client';

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId)
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId)
  }
`;

export const VIEW_POST = gql`
  mutation ViewPost($postId: ID!) {
    viewPost(postId: $postId)
  }
`;

export const COMMENT_POST = gql`
  mutation CommentPost($postId: ID!, $content: String!) {
    commentPost(postId: $postId, content: $content)
  }
`;

export const GET_POST_LIKES = gql`
  query GetPostLikes($postId: ID!) {
    postLikes(postId: $postId) {
      id
      userId
      createdAt
      user {
        id
        email
      }
    }
  }
`;

export const GET_POST_COMMENTS = gql`
  query GetPostComments($postId: ID!) {
    postComments(postId: $postId) {
      id
      userId
      content
      createdAt
      user {
        id
        email
      }
    }
  }
`;
