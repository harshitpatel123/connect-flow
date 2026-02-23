import { LikeStore } from '../infrastructure/like.store.js';
import { InteractionEventProducer } from '../events/interaction-event.producer.js';

export class LikePostUseCase {
  constructor(
    private likeStore: LikeStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    await this.likeStore.addLike(userId, postId);
    console.log(`[REDIS] ✅ Like added: user=${userId}, post=${postId}`);
    
    try {
      await this.eventProducer.postLiked(userId, postId);
    } catch (error) {
      console.error('[KAFKA] ❌ Failed to publish post-liked event:', error);
    }

    return true;
  }
}
