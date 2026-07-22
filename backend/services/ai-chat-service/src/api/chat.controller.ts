import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { CreateSessionUseCase } from '../application/create-session.usecase.js';
import { SendMessageUseCase } from '../application/send-message.usecase.js';
import { GetHistoryUseCase } from '../application/get-history.usecase.js';
import { ChatSessionRepository } from '../infrastructure/repositories/chat-session.repository.js';
import { v4 as uuidv4 } from 'uuid';

export class ChatController {
  constructor(
    private createSessionUseCase: CreateSessionUseCase,
    private sendMessageUseCase: SendMessageUseCase,
    private getHistoryUseCase: GetHistoryUseCase,
    private sessionRepository: ChatSessionRepository,
  ) {}

  async listSessions(req: AuthRequest, res: Response) {
    try {
      const sessions = await this.sessionRepository.findByUserId(req.user!.id);
      res.status(200).json(sessions);
    } catch (err: any) {
      console.error(`[AI-CHAT-SERVICE] ❌ List sessions failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }

  async createSession(req: AuthRequest, res: Response) {
    try {
      const session = await this.createSessionUseCase.execute(req.user!.id);
      console.log(`[AI-CHAT-SERVICE] Session created: ${session.id} for user: ${req.user!.id}`);
      res.status(201).json({ sessionId: session.id });
    } catch (err: any) {
      console.error(`[AI-CHAT-SERVICE] ❌ Create session failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const messages = await this.getHistoryUseCase.execute(req.params.id, req.user!.id);
      res.status(200).json(messages);
    } catch (err: any) {
      if (err.message === 'SESSION_NOT_FOUND') return res.status(404).json({ error: 'Session not found' });
      if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });
      console.error(`[AI-CHAT-SERVICE] ❌ Get history failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }

  async sendMessage(req: AuthRequest, res: Response) {
    const { content } = req.body;
    console.log(`[AI-CHAT-SERVICE] sendMessage called — sessionId: ${req.params.id}, userId: ${req.user?.id}, content: "${content}"`);

    if (!content?.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    let clientAborted = false;
    req.on('close', () => { clientAborted = true; });

    try {
      for await (const event of this.sendMessageUseCase.execute(
        req.params.id,
        req.user!.id,
        content,
        requestId,
      )) {
        if (clientAborted) break;
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (err: any) {
      console.error(`[AI-CHAT-SERVICE] [${requestId}] Controller error:`, err.message);
      if (!clientAborted) {
        if (err.message === 'SESSION_NOT_FOUND') {
          res.write(`event: error\ndata: ${JSON.stringify({ message: 'Session not found' })}\n\n`);
        } else if (err.message === 'FORBIDDEN') {
          res.write(`event: error\ndata: ${JSON.stringify({ message: 'Forbidden' })}\n\n`);
        } else {
          res.write(`event: error\ndata: ${JSON.stringify({ message: 'Internal error' })}\n\n`);
        }
      }
    } finally {
      res.end();
    }
  }
}
