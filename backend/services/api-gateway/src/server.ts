import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';
import { initTracer } from './config/jaeger';
import { registerService, deregisterService } from './config/consul';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';
import { formatError } from './graphql/errorFormatter';
import { globalRateLimiter, graphqlRateLimiter } from './middleware/rateLimiter';

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();

  // Initialize Jaeger tracer
  const tracer = initTracer();

  // Apollo Server with error formatting
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
  });

  await server.start();

  // Middleware (order matters!)
  app.use(loggingMiddleware);  // First: Log all requests
  app.use(globalRateLimiter);  // Second: Global rate limiting
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'api-gateway' });
  });

  // GraphQL endpoint with operation-specific rate limiting
  app.use(
    '/graphql',
    graphqlRateLimiter,  // GraphQL-specific rate limiting
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req, tracer),
    })
  );

  // Error handler (must be last)
  app.use(errorHandler);

  // Start server
  const httpServer = app.listen(PORT, async () => {
    const serviceAddress = process.env.SERVICE_ADDRESS || 'api-gateway';
    console.log(`🚀 API Gateway running at http://localhost:${PORT}/graphql`);
    console.log(`📍 Service URL: http://${serviceAddress}:${PORT}`);
    console.log(`🏥 Health check: http://${serviceAddress}:${PORT}/health`);
    
    // Register with Consul
    try {
      await registerService();
    } catch (error) {
      console.error('❌ Failed to register with Consul:', error);
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Deregister from Consul (ignore errors if already deregistered)
    try {
      await deregisterService();
      console.log('✅ Deregistered from Consul');
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        console.log('ℹ️  Service already deregistered from Consul');
      } else {
        console.error('❌ Failed to deregister from Consul:', error.message);
      }
    }
    
    await server.stop();
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
