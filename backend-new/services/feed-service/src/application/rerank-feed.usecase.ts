import { FeedStore } from '../infrastructure/feed.store.js';
import { PostServiceClient } from '../clients/post-service.client.js';
import { InteractionServiceClient } from '../clients/interaction-service.client.js';

export class RerankFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private postClient: PostServiceClient,
    private interactionClient: InteractionServiceClient
  ) {}

  async execute(userId: string): Promise<void> {
    const currentFeedPostIds = await this.feedStore.getFeed(userId, 0, 49);
    if (currentFeedPostIds.length === 0) return;

    const posts = await this.postClient.getPostsByIds(currentFeedPostIds);
    const interests = await this.interactionClient.getUserInterests(userId);

    for (const post of posts) {
      let maxAffinity = 0;
      for (const category of post.categoryTags) {
        const interest = interests.find(i => i.category === category);
        if (interest) {
          maxAffinity = Math.max(maxAffinity, interest.affinityScore);
        }
      }

      const now = Date.now() / 1000;
      const postCreatedAt = new Date(post.createdAt).getTime() / 1000;
      const ageInHours = (now - postCreatedAt) / 3600;
      const score = (maxAffinity * 20) - (ageInHours * 5);

      await this.feedStore.addToFeed(userId, post.id, score);
    }
  }
}
