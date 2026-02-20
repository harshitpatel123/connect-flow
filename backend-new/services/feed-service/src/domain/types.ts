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
}

export interface UserInterest {
  userId: string;
  category: string;
  affinityScore: number;
}
