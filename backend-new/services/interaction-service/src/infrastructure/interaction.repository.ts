import { PrismaClient } from '@prisma/client';
import { PostLike, Comment, UserInterest } from '../domain/types.js';
import { getServiceUrl } from '../config/consul.js';
import axios from 'axios';

export class InteractionRepository {
  constructor(private prisma: PrismaClient) {}

  async createComment(userId: string, postId: string, content: string): Promise<Comment> {
    const comment = await this.prisma.comment.create({
      data: { userId, postId, content }
    });

    // Increment comment count in post-service via HTTP
    try {
      const postServiceUrl = await getServiceUrl('post-service');
      await axios.patch(`${postServiceUrl}/posts/${postId}/comment-count/increment`);
    } catch (error) {
      console.error('Failed to increment comment count:', error);
    }

    return comment;
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
      const newScore = Math.max(0, existing.affinityScore + scoreChange);
      return this.prisma.userInterest.update({
        where: { userId_category: { userId, category } },
        data: { affinityScore: newScore }
      });
    }

    return this.prisma.userInterest.create({
      data: { userId, category, affinityScore: Math.max(0, scoreChange) }
    });
  }

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    return this.prisma.userInterest.findMany({
      where: { userId },
      orderBy: { affinityScore: 'desc' }
    });
  }

  async getUsersWithMinScoreForCategories(categories: string[], minScore: number) {
    const users = await this.prisma.userInterest.findMany({
      where: {
        category: { in: categories },
        affinityScore: { gte: minScore }
      },
      select: {
        userId: true,
        category: true,
        affinityScore: true
      }
    });

    const userMap = new Map<string, number>();
    users.forEach(u => {
      const current = userMap.get(u.userId) || 0;
      userMap.set(u.userId, Math.max(current, u.affinityScore));
    });

    return Array.from(userMap.entries()).map(([userId, maxAffinity]) => ({
      userId,
      maxAffinity
    }));
  }

  async getUserCategoryAffinity(userId: string, category: string): Promise<number> {
    const interest = await this.prisma.userInterest.findUnique({
      where: { userId_category: { userId, category } }
    });
    return interest?.affinityScore || 0;
  }

  async getUserLikedPostIds(userId: string): Promise<string[]> {
    const likes = await this.prisma.postLike.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { postId: true }
    });
    return [...new Set(likes.map(l => l.postId))];
  }

  async getUserCommentedPostIds(userId: string): Promise<string[]> {
    const comments = await this.prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { postId: true }
    });
    return [...new Set(comments.map(c => c.postId))];
  }
}
