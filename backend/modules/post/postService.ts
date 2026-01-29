import { PrismaClient } from "@prisma/client";
import { CreatePostUseCase } from "./application/create-post.usecase";
import { GetPostsUseCase } from "./application/get-posts.usecase";
import { GetPostsByIdsUseCase } from "./application/get-posts-by-ids.usecase";
import { CreatePostInput } from "./domain/post.types";
import { PostRepository } from "./infrastructure/post.repository";
import { PostEventPublisher } from "./infrastructure/post-event.publisher";

export class PostService {
  private createPostUseCase: CreatePostUseCase;
  private getPostsUseCase: GetPostsUseCase;
  private getPostsByIdsUseCase: GetPostsByIdsUseCase;

  constructor(prisma: PrismaClient) {
    const repo = new PostRepository(prisma);
    const publisher = new PostEventPublisher();
    
    this.createPostUseCase = new CreatePostUseCase(repo, publisher);
    this.getPostsUseCase = new GetPostsUseCase(repo);
    this.getPostsByIdsUseCase = new GetPostsByIdsUseCase(repo);
  }

  createPost(input: CreatePostInput) {
    return this.createPostUseCase.execute(input);
  }

  getMyPosts(userId: string) {
    return this.getPostsUseCase.execute(userId);
  }

  getPostsByIds(ids: string[]) {
    return this.getPostsByIdsUseCase.execute(ids);
  }
}
