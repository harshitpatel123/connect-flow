export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(id: string, userId: string): ChatSession {
    const now = new Date();
    return new ChatSession(id, userId, null, now, now);
  }
}
