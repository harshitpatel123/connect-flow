import { GetFeedUseCase } from "./application/get-feed.usecase";
import { FeedStore } from "internal/cache/feed.store";
import { SeenStore } from "internal/cache/seen.store";

export class FeedService {
  private getFeedUseCase: GetFeedUseCase;

  constructor() {
    const feedStore = new FeedStore();
    const seenStore = new SeenStore();
    
    this.getFeedUseCase = new GetFeedUseCase(feedStore, seenStore);
  }

  getMyFeed(userId: string) {
    return this.getFeedUseCase.execute(userId);
  }
}
