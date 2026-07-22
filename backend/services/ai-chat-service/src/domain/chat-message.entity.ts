import { v4 as uuidv4 } from 'uuid';
import { Role } from './role.value-object.js';

export class ChatMessage {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly role: Role,
    public readonly content: string,
    public readonly isPartial: boolean,
    public readonly createdAt: Date,
  ) {
    if (!Object.values(Role).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
  }

  static createUserMessage(sessionId: string, content: string): ChatMessage {
    return new ChatMessage(uuidv4(), sessionId, Role.user, content, false, new Date());
  }

  static createAssistantMessage(sessionId: string, content: string, isPartial: boolean): ChatMessage {
    return new ChatMessage(uuidv4(), sessionId, Role.assistant, content, isPartial, new Date());
  }
}
