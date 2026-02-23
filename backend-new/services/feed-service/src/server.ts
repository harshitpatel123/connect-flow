import express from 'express';
import cors from 'cors';
import feedRoutes from './api/routes.js';
import { registerService, deregisterService } from './config/consul.js';
import { connectKafka } from './events/kafka.client.js';
import { startFeedConsumer } from './events/feed-event.consumer.js';
import { startReRankConsumer } from './events/rerank-event.consumer.js';
import { BuildFeedUseCase } from './application/build-feed.usecase.js';
import { RerankFeedUseCase } from './application/rerank-feed.usecase.js';
import { feedStore } from './infrastructure/feed.store.js';
import { postServiceClient } from './clients/post-service.client.js';
import { interactionServiceClient } from './clients/interaction-service.client.js';
import { loggingMiddleware } from './middleware/logging.js';

const PORT = process.env.PORT || 5004;

async function startServer() {
  const app = express();

  // Middleware
  app.use(loggingMiddleware);
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'feed-service' });
  });

  // Routes
  app.use('/feed', feedRoutes);

  // Connect Kafka and start consumers
  try {
    await connectKafka();
    
    const buildFeedUseCase = new BuildFeedUseCase(feedStore, interactionServiceClient);
    const rerankFeedUseCase = new RerankFeedUseCase(feedStore, postServiceClient, interactionServiceClient);
    
    await startFeedConsumer(buildFeedUseCase, postServiceClient, interactionServiceClient);
    await startReRankConsumer(rerankFeedUseCase);
  } catch (error) {
    console.error('Failed to start Kafka consumers, continuing anyway...');
  }

  // Start server
  const server = app.listen(PORT, async () => {
    const serviceAddress = process.env.SERVICE_ADDRESS || 'feed-service';
    console.log(`🚀 Feed Service running on port ${PORT}`);
    console.log(`📍 Service URL: http://${serviceAddress}:${PORT}`);
    console.log(`🏥 Health check: http://${serviceAddress}:${PORT}/health`);
    
    // Register with Consul
    try {
      await registerService();
    } catch (error) {
      console.error('Failed to register with Consul, continuing anyway...');
    }
  });

  // Graceful shutdown
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
