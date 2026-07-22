import { Redis } from 'ioredis';
import { ChatMessage } from '../../domain/chat-message.entity.js';
import { Role } from '../../domain/role.value-object.js';

const CONTEXT_TTL = 3600; // 1 hour
const CONTEXT_WINDOW = 20;

export class ChatContextCache {
  constructor(private redis: Redis) {}

  async get(sessionId: string): Promise<ChatMessage[] | null> {
    try {
      const raw = await this.redis.get(`chat:context:${sessionId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Array<{
        id: string; sessionId: string; role: Role;
        content: string; isPartial: boolean; createdAt: string;
      }>;
      return parsed.map((m) => new ChatMessage(m.id, m.sessionId, m.role, m.content, m.isPartial, new Date(m.createdAt)));
    } catch {
      return null;
    }
  }

  async append(sessionId: string, newMessages: ChatMessage[]): Promise<void> {
    try {
      const current = await this.get(sessionId) ?? [];
      const updated = [...current, ...newMessages].slice(-CONTEXT_WINDOW);
      await this.redis.set(`chat:context:${sessionId}`, JSON.stringify(updated), 'EX', CONTEXT_TTL);
    } catch (err) {
      console.warn(`[AI-CHAT-SERVICE] Redis cache append failed for session ${sessionId}:`, err);
    }
  }

  async invalidate(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`chat:context:${sessionId}`);
    } catch {
      // best-effort
    }
  }
}
