import { PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, passwordHash }
    });
  }
}
