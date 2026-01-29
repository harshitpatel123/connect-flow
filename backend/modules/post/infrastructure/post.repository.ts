import { PrismaClient } from "@prisma/client";

export class PostRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, content: string) {
    return this.prisma.post.create({
      data: {
        userId,
        content
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
}
