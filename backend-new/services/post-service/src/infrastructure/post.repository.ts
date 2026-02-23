import { PrismaClient } from '@prisma/client';
import { Post } from '../domain/types.js';

export class PostRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, content: string, categoryTags: string[] = []): Promise<Post> {
    const post = await this.prisma.post.create({
      data: { userId, content, categoryTags }
    });
    return this.serializePost(post);
  }

  async findById(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id }
    });
    return post ? this.serializePost(post) : null;
  }

  async findByUserId(userId: string): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return posts.map(p => this.serializePost(p));
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } }
    });
    return posts.map(p => this.serializePost(p));
  }

  async findRecent(limit: number): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    return posts.map(p => this.serializePost(p));
  }

  private serializePost(post: any): Post {
    return {
      ...post,
      likeCount: Number(post.likeCount),
      commentCount: Number(post.commentCount),
      viewCount: Number(post.viewCount)
    };
  }

  async getPostLikes(postId: string) {
    // PostLikes are in interaction-service DB, not here
    // This should be called via HTTP to interaction-service
    return [];
  }

  async getPostComments(postId: string) {
    // Comments are in interaction-service DB, not here
    // This should be called via HTTP to interaction-service
    return [];
  }
}
