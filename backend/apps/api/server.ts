import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";

import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { JwtService } from "modules/auth/infrastructure/jwt.service";
import { connectProducer } from "internal/messaging/kafka.producer";
import { startFeedConsumer } from "modules/feed/infrastructure/feed-event.consumer";
import { BuildFeedUseCase } from "modules/feed/application/build-feed.usecase";
import { feedStore } from "internal/cache/feed.store";
import { seenStore } from "internal/cache/seen.store";
import { UserRepository } from "modules/auth/infrastructure/user.repository";
import { prisma } from "internal/database/prisma.client";
import { interactionBatchWorker } from "modules/interaction/infrastructure/interaction-batch.worker";
import { warmUpRedisCounters } from "internal/cache/redis-warmup";

const jwtService = new JwtService();
const buildFeedUseCase = new BuildFeedUseCase(feedStore, seenStore);

await connectProducer();
await startFeedConsumer(buildFeedUseCase, new UserRepository(prisma));

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

