import { PrismaClient } from '@prisma/client';
import { PostLike, Comment, UserInterest } from '../domain/types.js';

export class InteractionRepository {
  constructor(private prisma: PrismaClient) {}

  async createComment(userId: string, postId: string, content: string): Promise<Comment> {
    return this.prisma.comment.create({
      data: { userId, postId, content }
    });
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    return this.prisma.postLike.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async upsertInterest(userId: string, category: string, scoreChange: number): Promise<UserInterest> {
    const existing = await this.prisma.userInterest.findUnique({
      where: { userId_category: { userId, category } }
    });

    if (existing) {
      return this.prisma.userInterest.update({
        where: { userId_category: { userId, category } },
        data: { affinityScore: existing.affinityScore + scoreChange }
      });
    }

    return this.prisma.userInterest.create({
      data: { userId, category, affinityScore: Math.max(0, scoreChange) }
    });
  }

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    return this.prisma.userInterest.findMany({
      where: { userId }
    });
  }
}
