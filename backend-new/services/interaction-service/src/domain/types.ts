export interface PostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface UserInterest {
  id: string;
  userId: string;
  category: string;
  affinityScore: number;
  lastUpdated: Date;
}
