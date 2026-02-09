import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";

import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { JwtService } from "modules/auth/infrastructure/jwt.service";
import { connectProducer } from "internal/messaging/kafka.producer";
import { startFeedConsumer } from "modules/feed/infrastructure/feed-event.consumer";
import { startInterestConsumer } from "modules/interaction/events/interest-event.consumer";
import { startReRankConsumer } from "modules/feed/infrastructure/rerank-event.consumer";
import { BuildFeedUseCase } from "modules/feed/application/build-feed.usecase";
import { ReRankFeedUseCase } from "modules/feed/application/rerank-feed.usecase";
import { InterestEventProducer } from "modules/interaction/events/interest.event.producer";
import { feedStore } from "internal/cache/feed.store";
import { seenStore } from "internal/cache/seen.store";
import { UserRepository } from "modules/auth/infrastructure/user.repository";
import { InterestRepository } from "modules/interaction/infrastructure/interest.repository";
import { PostRepository } from "modules/post/infrastructure/post.repository";
import { prisma } from "internal/database/prisma.client";
import { interactionBatchWorker } from "modules/interaction/infrastructure/interaction-batch.worker";
import { warmUpRedisCounters } from "internal/cache/redis-warmup";

const jwtService = new JwtService();

// Initialize repositories
const userRepository = new UserRepository(prisma);
const interestRepository = new InterestRepository(prisma);
const postRepository = new PostRepository(prisma);

// Initialize event producers
const interestEventProducer = new InterestEventProducer();

// Initialize use cases
const buildFeedUseCase = new BuildFeedUseCase(feedStore, seenStore, interestRepository);
const reRankFeedUseCase = new ReRankFeedUseCase(feedStore, postRepository, interestRepository);

// Connect Kafka and start consumers
await connectProducer();

// PUSH MODEL: Builds feed when post is created
await startFeedConsumer(buildFeedUseCase, userRepository, interestRepository, postRepository);

// INTEREST TRACKING: Updates user interests on interactions
await startInterestConsumer(interestRepository, postRepository, interestEventProducer);

// RE-RANK MODEL: Re-ranks feed after interests are updated (EVENT CHAINING)
await startReRankConsumer(reRankFeedUseCase);

// Warm up Redis counters from database
await warmUpRedisCounters();

// Start batch worker for likes and views
interactionBatchWorker.start();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageDisabled()]
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return {};

    const token = authHeader.replace("Bearer ", "");

    try {
      const user = jwtService.verifyToken(token);
      return { user };
    } catch {
      return {};
    }
  },
  listen: { port: 4000 }
});

console.log(`🚀 Server ready at ${url}`);

