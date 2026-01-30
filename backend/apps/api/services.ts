import { prisma } from "../../internal/database/prisma.client";
import { AuthService } from "../../modules/auth/authService";
import { PostService } from "modules/post/postService";
import { FeedService } from "modules/feed/feedService";
import { InteractionService } from "modules/interaction/interaction.service";

export const authService = new AuthService(prisma);
export const postService = new PostService(prisma);
export const feedService = new FeedService();
export const interactionService = new InteractionService(prisma);
