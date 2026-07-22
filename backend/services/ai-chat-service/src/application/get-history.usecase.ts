import { ChatSessionRepository } from '../infrastructure/repositories/chat-session.repository.js';
import { ChatMessageRepository } from '../infrastructure/repositories/chat-message.repository.js';
import { ChatMessage } from '../domain/chat-message.entity.js';

export class GetHistoryUseCase {
  constructor(
    private sessionRepository: ChatSessionRepository,
    private messageRepository: ChatMessageRepository,
  ) {}

  async execute(sessionId: string, userId: string): Promise<ChatMessage[]> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (session.userId !== userId) throw new Error('FORBIDDEN');

    return this.messageRepository.getBySessionId(sessionId);
  }
}
