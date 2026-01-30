import { PrismaClient } from "@prisma/client";

export class InteractionRepository {
  constructor(private prisma: PrismaClient) {}

  async addComment(userId: string, postId: string, content: string) {
    await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: { increment: 1 },
      },
    });
  }
}
