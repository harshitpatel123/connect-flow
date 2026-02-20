import { FeedStore } from '../infrastructure/feed.store.js';
import { PostServiceClient } from '../clients/post-service.client.js';
import { InteractionServiceClient } from '../clients/interaction-service.client.js';
import { Post } from '../domain/types.js';

export class RegenerateFeedUseCase {
  constructor(
    private feedStore: FeedStore,
    private postClient: PostServiceClient,
    private interactionClient: InteractionServiceClient
  ) {}

  async execute(userId: string): Promise<Post[]> {
    const personalizedPostIds = await this.feedStore.getFeed(userId, 0, 14);
    
    const trendingPosts = await this.getTrendingPosts(userId, personalizedPostIds, 5);
    
    const allPostIds = [...new Set([...personalizedPostIds, ...trendingPosts.map(p => p.id)])];
    
    if (allPostIds.length < 10) {
      const additionalPosts = await this.getAdditionalPosts(userId, allPostIds, 10 - allPostIds.length);
      allPostIds.push(...additionalPosts.map(p => p.id));
    }
    
    await this.feedStore.clearFeed(userId);
    
    for (let i = 0; i < allPostIds.length; i++) {
      await this.feedStore.addToFeed(userId, allPostIds[i], 1000000 - i);
    }

    // Fetch full post details
    const posts = await this.postClient.getPostsByIds(allPostIds);
    
    // Maintain feed order
    const postMap = new Map(posts.map(p => [p.id, p]));
    return allPostIds.map(id => postMap.get(id)).filter(Boolean) as Post[];
  }

  private async getTrendingPosts(userId: string, existingPostIds: string[], limit: number) {
    const userInterests = await this.interactionClient.getUserInterests(userId);
    const interestedCategories = userInterests.map(i => i.category);

    const recentPosts = await this.postClient.getRecentPosts(100);

    const trendingCandidates = recentPosts
      .filter(post => {
        if (existingPostIds.includes(post.id)) return false;
        const hasInterestedCategory = post.categoryTags.some(cat => 
          interestedCategories.includes(cat)
        );
        return !hasInterestedCategory;
      })
      .map(post => ({
        ...post,
        engagementScore: (post.likeCount * 2) + (post.commentCount * 3)
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    return trendingCandidates;
  }

  private async getAdditionalPosts(userId: string, existingPostIds: string[], needed: number) {
    const recentPosts = await this.postClient.getRecentPosts(50);
    
    const additionalPosts = recentPosts
      .filter(post => !existingPostIds.includes(post.id))
      .slice(0, needed);

    return additionalPosts;
  }
}
