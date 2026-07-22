import { ChatSessionRepository } from '../infrastructure/repositories/chat-session.repository.js';
import { ChatSession } from '../domain/chat-session.entity.js';

export class CreateSessionUseCase {
  constructor(private sessionRepository: ChatSessionRepository) {}

  async execute(userId: string): Promise<ChatSession> {
    console.log(`[AI-CHAT-SERVICE] Creating session for user: ${userId}`);
    return this.sessionRepository.create(userId);
  }
}
