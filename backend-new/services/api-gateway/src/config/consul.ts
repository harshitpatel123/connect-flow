import Consul from 'consul';

const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';
const CONSUL_PORT = parseInt(process.env.CONSUL_PORT || '8500');
const SERVICE_NAME = 'api-gateway';
const SERVICE_PORT = parseInt(process.env.PORT || '4000');
const SERVICE_ID = `${SERVICE_NAME}-${SERVICE_PORT}`;

const consul = new Consul({
  host: CONSUL_HOST,
  port: CONSUL_PORT.toString(),
  promisify: true,
});

export async function registerService() {
  await consul.agent.service.register({
    name: SERVICE_NAME,
    id: SERVICE_ID,
    address: 'localhost',
    port: SERVICE_PORT,
    check: {
      http: `http://localhost:${SERVICE_PORT}/health`,
      interval: '10s',
    },
  });
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
    console.error(`Failed to discover ${serviceName}:`, error);
    const fallbackUrl = process.env[`${serviceName.toUpperCase().replace('-', '_')}_URL`];
    if (!fallbackUrl) {
      throw new Error(`Service ${serviceName} not found and no fallback URL configured`);
    }
    return fallbackUrl;
  }
}

export { consul };
