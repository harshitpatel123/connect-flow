import { LikeStore } from '../infrastructure/like.store.js';
import { InteractionEventProducer } from '../events/interaction-event.producer.js';

export class UnlikePostUseCase {
  constructor(
    private likeStore: LikeStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    await this.likeStore.removeLike(userId, postId);
    
    try {
      await this.eventProducer.postUnliked(userId, postId);
    } catch (error) {
      console.error('Failed to publish post-unliked event:', error);
    }

    return true;
  }
}
