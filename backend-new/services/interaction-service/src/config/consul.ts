import Consul from 'consul';

const consul = new Consul({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || '8500',
  promisify: true
});

const SERVICE_NAME = process.env.SERVICE_NAME || 'interaction-service';
const SERVICE_ID = process.env.SERVICE_ID || 'interaction-service-1';
const SERVICE_PORT = parseInt(process.env.PORT || '5003');

export async function registerService() {
  try {
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: SERVICE_NAME,
      address: 'localhost',
      port: SERVICE_PORT,
      check: {
        http: `http://localhost:${SERVICE_PORT}/health`,
        interval: '10s'
      }
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
  try {
    const services: any = await consul.health.service({ service: serviceName, passing: true });
    if (!services || services.length === 0) {
      throw new Error(`No healthy instances of ${serviceName} found`);
    }
    const service = services[0].Service;
    return `http://${service.Address}:${service.Port}`;
  } catch (error) {
    console.warn(`⚠️  Consul lookup failed for ${serviceName}, using fallback`);
    const fallbackUrls: Record<string, string> = {
      'post-service': process.env.POST_SERVICE_URL || 'http://localhost:5002'
    };
    return fallbackUrls[serviceName] || `http://localhost:5000`;
  }
}

export { consul };
