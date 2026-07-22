import express, { Request, Response } from 'express';
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
import { getServiceUrl } from './config/consul';
import http from 'http';
import https from 'https';

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

  // AI Chat proxy — REST+SSE passthrough (intentionally not GraphQL, see ai-chat-service README)
  app.use('/api/chat', (req: Request, res: Response) => {
    getServiceUrl('ai-chat-service').then((baseUrl) => {
      const target = new URL(req.originalUrl, baseUrl);
      const isHttps = target.protocol === 'https:';
      const transport = isHttps ? https : http;

      const bodyData = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : undefined;

      const options = {
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: target.pathname + target.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: target.host,
          ...(bodyData ? { 'content-length': Buffer.byteLength(bodyData).toString() } : {}),
        },
      };

      const proxyReq = transport.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (err) => {
        console.error('[API-GATEWAY] Chat proxy error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Chat service unavailable' });
      });

      if (bodyData) {
        proxyReq.write(bodyData);
        proxyReq.end();
      } else {
        req.pipe(proxyReq, { end: true });
      }
    }).catch((err) => {
      console.error('[API-GATEWAY] Failed to resolve ai-chat-service:', err.message);
      res.status(502).json({ error: 'Chat service unavailable' });
    });
  });

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
