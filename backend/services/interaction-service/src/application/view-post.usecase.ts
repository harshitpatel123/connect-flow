import { SeenStore } from '../infrastructure/seen.store.js';
import { InteractionEventProducer } from '../events/interaction-event.producer.js';

export class ViewPostUseCase {
  constructor(
    private seenStore: SeenStore,
    private eventProducer: InteractionEventProducer
  ) {}

  async execute(userId: string, postId: string): Promise<boolean> {
    const alreadySeen = await this.seenStore.hasSeen(userId, postId);
    
    await this.seenStore.markSeen(userId, postId);

    if (!alreadySeen) {
      await this.seenStore.incrementViewCount(postId);
      await this.seenStore.addToQueue(postId);

      try {
        await this.eventProducer.postViewed(userId, postId);
      } catch (error) {
        console.error('Failed to publish post-viewed event:', error);
      }
      return true;
    }

    return false;
  }
}
