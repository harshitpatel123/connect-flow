import { PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor(private prisma: PrismaClient) { }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, passwordHash }
    });
  }

  async findAllExcept(userId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true
      },
      select: { id: true }
    });
  }

  async findByIds(userIds: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    });
  }

  async findById(userId: string) {
    console.log("🔍 [USER REPOSITORY] Finding user by ID:", userId);
    const user = this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    return user;
  }
}
