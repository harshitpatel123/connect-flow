import Consul from 'consul';

const consul = new Consul({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || '8500',
  promisify: true
});

const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const SERVICE_ID = process.env.SERVICE_ID || 'auth-service-1';
const SERVICE_PORT = parseInt(process.env.PORT || '5001');

export async function registerService() {
  try {
    // In Docker, use container name; outside Docker, use localhost
    const serviceAddress = process.env.SERVICE_ADDRESS || SERVICE_NAME;
    
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: SERVICE_NAME,
      address: serviceAddress,
      port: SERVICE_PORT,
      check: {
        http: `http://${serviceAddress}:${SERVICE_PORT}/health`,
        interval: '60s'
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