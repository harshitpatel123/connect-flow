export type CreatePostInput = {
  userId: string;
  content: string;
  categoryTags?: string[];
};

export type PostDTO = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
};
