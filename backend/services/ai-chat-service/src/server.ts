import express from 'express';
import cors from 'cors';
import chatRoutes from './api/chat.routes.js';
import { registerService, deregisterService } from './config/consul.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT);

async function startServer() {
  const app = express();

  app.use(loggingMiddleware);
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'ai-chat-service' });
  });

  app.use('/api/chat', chatRoutes);

  const server = app.listen(PORT, async () => {
    const serviceAddress = env.SERVICE_ADDRESS;
    console.log(`🚀 AI Chat Service running on port ${PORT}`);
    console.log(`📍 Service URL: http://${serviceAddress}:${PORT}`);
    console.log(`🏥 Health check: http://${serviceAddress}:${PORT}/health`);

    try {
      await registerService();
    } catch (error) {
      console.error('Failed to register with Consul, continuing anyway...');
    }
  });

  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    try {
      await deregisterService();
    } catch (error: any) {
      if (error.response?.statusCode !== 404) {
        console.error('⚠️  Consul deregistration failed');
      }
    }

    server.close(() => {
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
