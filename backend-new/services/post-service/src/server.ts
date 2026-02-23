import express from 'express';
import cors from 'cors';
import postRoutes from './api/routes.js';
import { registerService, deregisterService } from './config/consul.js';
import { connectProducer } from './events/kafka.client.js';
import { loggingMiddleware } from './middleware/logging.js';

const PORT = process.env.PORT || 5002;

async function startServer() {
  const app = express();

  // Middleware
  app.use(loggingMiddleware);
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'post-service' });
  });

  // Routes
  app.use('/posts', postRoutes);

  // Connect Kafka producer
  try {
    await connectProducer();
  } catch (error) {
    console.error('Failed to connect Kafka producer, continuing anyway...');
  }

  // Start server
  const server = app.listen(PORT, async () => {
    const serviceAddress = process.env.SERVICE_ADDRESS || 'post-service';
    console.log(`🚀 Post Service running on port ${PORT}`);
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
