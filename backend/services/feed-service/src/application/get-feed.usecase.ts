import { FeedStore } from '../infrastructure/feed.store.js';
import { PostServiceClient } from '../clients/post-service.client.js';
import { Post } from '../domain/types.js';

export class GetFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private postClient: PostServiceClient
  ) {}

  async execute(userId: string, parentSpan?: any): Promise<Post[]> {
    const postIds = await this.feedStore.getFeed(userId, 0, 19);
    
    if (postIds.length === 0) return [];
    
    const posts = await this.postClient.getPostsByIds(postIds, parentSpan);
    
    // Maintain feed order
    const postMap = new Map(posts.map(p => [p.id, p]));
    return postIds.map(id => postMap.get(id)).filter(Boolean) as Post[];
  }
}
