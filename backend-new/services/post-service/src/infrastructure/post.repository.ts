import { PrismaClient } from '@prisma/client';
import { Post } from '../domain/types.js';

export class PostRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, content: string, categoryTags: string[] = []): Promise<Post> {
    return this.prisma.post.create({
      data: { userId, content, categoryTags }
    });
  }

  async findById(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: { id }
    });
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { id: { in: ids } }
    });
  }
}
