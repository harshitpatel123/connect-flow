import { PrismaClient } from '@prisma/client';
import { ChatSession } from '../../domain/chat-session.entity.js';

export class ChatSessionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string): Promise<ChatSession> {
    const row = await this.prisma.chatSession.create({
      data: { userId },
    });
    return new ChatSession(row.id, row.userId, row.title, row.createdAt, row.updatedAt);
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.prisma.chatSession.update({ where: { id }, data: { title } });
  }

  async findById(id: string): Promise<ChatSession | null> {
    const row = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!row) return null;
    return new ChatSession(row.id, row.userId, row.title, row.createdAt, row.updatedAt);
  }

  async findByUserId(userId: string): Promise<ChatSession[]> {
    const rows = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => new ChatSession(r.id, r.userId, r.title, r.createdAt, r.updatedAt));
  }
}
