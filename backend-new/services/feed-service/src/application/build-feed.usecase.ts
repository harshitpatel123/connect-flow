import { FeedStore } from '../infrastructure/feed.store.js';
import { InteractionServiceClient } from '../clients/interaction-service.client.js';

export class BuildFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private interactionClient: InteractionServiceClient
  ) {}

  async execute(userId: string, postId: string, createdAt: number, categories: string[]): Promise<void> {
    const alreadySeen = await this.feedStore.hasSeen(userId, postId);
    if (alreadySeen) return;

    const interests = await this.interactionClient.getUserInterests(userId);
    
    let maxAffinity = 0;
    for (const category of categories) {
      const interest = interests.find(i => i.category === category);
      if (interest) {
        maxAffinity = Math.max(maxAffinity, interest.affinityScore);
      }
    }

    const now = Date.now() / 1000;
    const ageInHours = (now - createdAt / 1000) / 3600;
    const score = (maxAffinity * 20) - (ageInHours * 5);

    await this.feedStore.addToFeed(userId, postId, score);
  }
}
