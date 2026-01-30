import { PrismaClient } from "@prisma/client";

export class PostRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, content: string, categoryTags?: string[]) {
    return this.prisma.post.create({
      data: {
        userId,
        content,
        categoryTags: categoryTags || []
      }
    });
  }

  async findByUser(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.post.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" }
    });
  }

  async getPostLikes(postId: string) {
    return this.prisma.postLike.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" }
    });
  }

  async getPostComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" }
    });
  }
}
