import { ChatSessionRepository } from '../infrastructure/repositories/chat-session.repository.js';
import { ChatMessageRepository } from '../infrastructure/repositories/chat-message.repository.js';
import { ChatContextCache } from '../infrastructure/cache/chat-context.cache.js';
import { GeminiClient } from '../infrastructure/ai/gemini.client.js';
import { ChatMessage } from '../domain/chat-message.entity.js';

type StreamEvent =
  | { type: 'chunk'; data: string }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };

export class SendMessageUseCase {
  constructor(
    private sessionRepository: ChatSessionRepository,
    private messageRepository: ChatMessageRepository,
    private contextCache: ChatContextCache,
    private geminiClient: GeminiClient,
  ) {}

  async *execute(
    sessionId: string,
    userId: string,
    content: string,
    requestId: string,
  ): AsyncGenerator<StreamEvent> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    if (session.userId !== userId) throw new Error('FORBIDDEN');

    const userMsg = ChatMessage.createUserMessage(sessionId, content);
    await this.messageRepository.create(userMsg);

    // Auto-title session from first message using Gemini
    if (!session.title) {
      try {
        const titleResult = await this.geminiClient.generateTitle(content);
        await this.sessionRepository.updateTitle(sessionId, titleResult);
      } catch {
        // fallback to truncated message text
        const fallback = content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : '');
        await this.sessionRepository.updateTitle(sessionId, fallback);
      }
    }

    // Load context: Redis hit → use it, miss → read from Postgres and repopulate
    let context = await this.contextCache.get(sessionId);
    if (!context) {
      console.log(`[AI-CHAT-SERVICE] [${requestId}] Cache miss — loading context from DB`);
      context = await this.messageRepository.getLastN(sessionId, 20);
    }

    let fullText = '';
    try {
      for await (const chunk of this.geminiClient.streamGenerate([...context, userMsg], requestId)) {
        fullText += chunk;
        yield { type: 'chunk', data: chunk };
      }

      const assistantMsg = ChatMessage.createAssistantMessage(sessionId, fullText, false);
      await this.messageRepository.create(assistantMsg);
      await this.contextCache.append(sessionId, [userMsg, assistantMsg]);

      yield { type: 'done', messageId: assistantMsg.id };
    } catch (err: any) {
      console.error(`[AI-CHAT-SERVICE] [${requestId}] Gemini stream failed:`, err.message);

      if (fullText.length > 0) {
        const partial = ChatMessage.createAssistantMessage(sessionId, fullText, true);
        await this.messageRepository.create(partial);
        await this.contextCache.append(sessionId, [userMsg, partial]);
      }

      yield { type: 'error', message: 'Response generation was interrupted' };
    }
  }
}
