import { PrismaClient } from "@prisma/client";
import { LikePostUseCase } from "./application/like-post.usecase";
import { UnlikePostUseCase } from "./application/unlike-post.usecase";
import { ViewPostUseCase } from "./application/view-post.usecase";
import { CommentPostUseCase } from "./application/comment-post.usecase";
import { InteractionRepository } from "./infrastructure/interaction.repository";
import { InteractionEventProducer } from "./events/interaction.event.producer";
import { likeStore } from "internal/cache/like.store";
import { seenStore } from "internal/cache/seen.store";

export class InteractionService {
  private likePostUseCase: LikePostUseCase;
  private unlikePostUseCase: UnlikePostUseCase;
  private viewPostUseCase: ViewPostUseCase;
  private commentPostUseCase: CommentPostUseCase;

  constructor(prisma: PrismaClient) {
    const repository = new InteractionRepository(prisma);
    const eventProducer = new InteractionEventProducer();

    this.likePostUseCase = new LikePostUseCase(likeStore, eventProducer);
    this.unlikePostUseCase = new UnlikePostUseCase(likeStore, eventProducer);
    this.viewPostUseCase = new ViewPostUseCase(seenStore, eventProducer);
    this.commentPostUseCase = new CommentPostUseCase(repository);
  }

  likePost(userId: string, postId: string) {
    return this.likePostUseCase.execute(userId, postId);
  }

  unlikePost(userId: string, postId: string) {
    return this.unlikePostUseCase.execute(userId, postId);
  }

  viewPost(userId: string, postId: string) {
    return this.viewPostUseCase.execute(userId, postId);
  }

  commentPost(userId: string, postId: string, content: string) {
    return this.commentPostUseCase.execute(userId, postId, content);
  }
}
