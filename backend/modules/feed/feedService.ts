import { GetFeedUseCase } from "./application/get-feed.usecase";
import { feedStore } from "internal/cache/feed.store";
import { seenStore } from "internal/cache/seen.store";

export class FeedService {
  private getFeedUseCase: GetFeedUseCase;

  constructor() {
    this.getFeedUseCase = new GetFeedUseCase(feedStore, seenStore);
  }

  getMyFeed(userId: string) {
    return this.getFeedUseCase.execute(userId);
  }
}
