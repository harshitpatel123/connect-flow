import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '../../domain/chat-message.entity.js';
import { Role } from '../../domain/role.value-object.js';

export class GeminiClient {
  private model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;

  constructor(apiKey: string, modelName = 'gemini-3.1-flash-lite') {
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
  }

  async *streamGenerate(messages: ChatMessage[], requestId: string): AsyncGenerator<string> {
    const contents = messages
      .filter((m) => m.role !== Role.system)
      .map((m) => ({
        role: m.role === Role.assistant ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    console.log(`[AI-CHAT-SERVICE] [${requestId}] Starting Gemini stream (${contents.length} messages)`);

    const result = await this.model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a short chat title (max 6 words, no quotes, no punctuation at end) for a conversation that starts with: "${firstMessage}"` }],
      }],
    });
    const title = result.response.text().trim().slice(0, 60);
    return title || firstMessage.slice(0, 50);
  }
}
