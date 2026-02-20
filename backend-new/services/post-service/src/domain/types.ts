export interface Post {
  id: string;
  userId: string;
  content: string;
  likeCount: number;
  commentCount: number;
  viewCount: bigint;
  categoryTags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  userId: string;
  content: string;
  categoryTags?: string[];
}

export interface PostCreatedEvent {
  type: 'PostCreated';
  postId: string;
  userId: string;
  createdAt: number;
}
