import { GetFeedUseCase } from "./application/get-feed.usecase";
import { RegenerateFeedUseCase } from "./application/regenerate-feed.usecase";
import { feedStore } from "internal/cache/feed.store";
import { seenStore } from "internal/cache/seen.store";
import { PostRepository } from "modules/post/infrastructure/post.repository";
import { InterestRepository } from "modules/interaction/infrastructure/interest.repository";
import { PrismaClient } from "@prisma/client";

export class FeedService {
  private getFeedUseCase: GetFeedUseCase;
  private regenerateFeedUseCase: RegenerateFeedUseCase;

  constructor(prisma: PrismaClient) {
    const postRepository = new PostRepository(prisma);
    const interestRepository = new InterestRepository(prisma);

    this.getFeedUseCase = new GetFeedUseCase(feedStore, seenStore);
    this.regenerateFeedUseCase = new RegenerateFeedUseCase(
      feedStore,
      seenStore,
      postRepository,
      interestRepository
    );
  }

  getMyFeed(userId: string) {
    return this.getFeedUseCase.execute(userId);
  }

  regenerateFeed(userId: string) {
    return this.regenerateFeedUseCase.execute(userId);
  }
}
