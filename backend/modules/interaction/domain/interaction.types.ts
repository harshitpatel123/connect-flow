export interface LikePostInput {
  userId: string;
  postId: string;
}

export interface ViewPostInput {
  userId: string;
  postId: string;
}

export interface CommentPostInput {
  userId: string;
  postId: string;
  content: string;
}
