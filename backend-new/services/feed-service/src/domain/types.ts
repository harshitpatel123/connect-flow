export interface FeedItem {
  postId: string;
  score: number;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  categoryTags: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

export interface UserInterest {
  userId: string;
  category: string;
  affinityScore: number;
}
