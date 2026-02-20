import { InteractionRepository } from '../infrastructure/interaction.repository.js';
import { InteractionEventProducer } from '../events/interaction-event.producer.js';

export class CommentPostUseCase {
  constructor(
    private repository: InteractionRepository,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string, content: string): Promise<boolean> {
    await this.repository.createComment(userId, postId, content);
    
    try {
      await this.eventProducer.postCommented(userId, postId);
    } catch (error) {
      console.error('Failed to publish post-commented event:', error);
    }

    return true;
  }
}
