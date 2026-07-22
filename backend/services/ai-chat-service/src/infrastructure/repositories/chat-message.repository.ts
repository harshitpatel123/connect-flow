import { PrismaClient } from '@prisma/client';
import { ChatMessage } from '../../domain/chat-message.entity.js';
import { Role } from '../../domain/role.value-object.js';

export class ChatMessageRepository {
  constructor(private prisma: PrismaClient) {}

  async create(entity: ChatMessage): Promise<ChatMessage> {
    const row = await this.prisma.chatMessage.create({
      data: {
        id: entity.id,
        sessionId: entity.sessionId,
        role: entity.role,
        content: entity.content,
        isPartial: entity.isPartial,
        createdAt: entity.createdAt,
      },
    });
    return new ChatMessage(row.id, row.sessionId, row.role as Role, row.content, row.isPartial, row.createdAt);
  }

  async getLastN(sessionId: string, n: number): Promise<ChatMessage[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: n,
    });
    return rows
      .reverse()
      .map((r) => new ChatMessage(r.id, r.sessionId, r.role as Role, r.content, r.isPartial, r.createdAt));
  }

  async getBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => new ChatMessage(r.id, r.sessionId, r.role as Role, r.content, r.isPartial, r.createdAt));
  }
}
