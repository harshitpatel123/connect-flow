import Consul from 'consul';

const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';
const CONSUL_PORT = parseInt(process.env.CONSUL_PORT || '8500');
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-gateway';
const SERVICE_PORT = parseInt(process.env.PORT || '4000');
const SERVICE_ID = process.env.SERVICE_ID || `${SERVICE_NAME}-${SERVICE_PORT}`;

const consul = new Consul({
  host: CONSUL_HOST,
  port: CONSUL_PORT.toString(),
  promisify: true,
});

export async function registerService() {
  try {
    const serviceAddress = process.env.SERVICE_ADDRESS || SERVICE_NAME;
    
    await consul.agent.service.register({
      name: SERVICE_NAME,
      id: SERVICE_ID,
      address: serviceAddress,
      port: SERVICE_PORT,
      check: {
        http: `http://${serviceAddress}:${SERVICE_PORT}/health`,
        interval: '60s',
      },
    });
    console.log(`✅ Registered ${SERVICE_NAME} with Consul`);
  } catch (error) {
    console.error('❌ Failed to register with Consul:', error);
    throw error;
  }
}

export async function deregisterService() {
  await consul.agent.service.deregister(SERVICE_ID);
}

export async function getServiceUrl(serviceName: string): Promise<string> {
  // In Docker, use direct service names (Docker DNS)
  const fallbackUrls: Record<string, string> = {
    'auth-service': process.env.AUTH_SERVICE_URL || 'http://auth-service:5001',
    'post-service': process.env.POST_SERVICE_URL || 'http://post-service:5002',
    'interaction-service': process.env.INTERACTION_SERVICE_URL || 'http://interaction-service:5003',
    'feed-service': process.env.FEED_SERVICE_URL || 'http://feed-service:5004',
    'ai-chat-service': process.env.AI_CHAT_SERVICE_URL || 'http://ai-chat-service:5005',
  };

  try {
    const services: any = await consul.health.service({ service: serviceName, passing: true });
    // console.log(`Discovered ${serviceName} services from Consul:`, services);
    if (services && services.length > 0) {
      const service = services[0].Service;
      return `http://${service.Address}:${service.Port}`;
    }
  } catch (error) {
    console.error(`Failed to discover ${serviceName}:`, error);
  }

  // Fallback to Docker service name
  const fallbackUrl = fallbackUrls[serviceName];
  if (!fallbackUrl) {
    throw new Error(`Service ${serviceName} not found and no fallback URL configured`);
  }
  console.log(`--->>> Using fallback URL for ${serviceName}: ${fallbackUrl}`);
  return fallbackUrl;
}

export { consul };
