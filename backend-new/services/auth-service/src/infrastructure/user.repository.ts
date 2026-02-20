import { PrismaClient } from '@prisma/client';
import { User } from '../domain/types.js';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(email: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { id: { in: ids } }
    });
  }
}
