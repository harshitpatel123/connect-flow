import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";

import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { authService } from "./services";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageDisabled()]
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({
    authService
  }),
  listen: { port: 4000 }
});

console.log(`🚀 Server ready at ${url}`);
