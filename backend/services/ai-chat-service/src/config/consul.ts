import Consul from 'consul';
import { env } from './env.js';

const consul = new Consul({
  host: env.CONSUL_HOST,
  port: env.CONSUL_PORT,
  promisify: true,
});

const SERVICE_PORT = parseInt(env.PORT);

export async function registerService() {
  try {
    await consul.agent.service.register({
      id: env.SERVICE_ID,
      name: env.SERVICE_NAME,
      address: env.SERVICE_ADDRESS,
      port: SERVICE_PORT,
      check: {
        http: `http://${env.SERVICE_ADDRESS}:${SERVICE_PORT}/health`,
        interval: '60s',
      },
    });
    console.log(`✅ Registered ${env.SERVICE_NAME} with Consul`);
  } catch (error) {
    console.error('❌ Failed to register with Consul:', error);
    throw error;
  }
}

export async function deregisterService() {
  await consul.agent.service.deregister(env.SERVICE_ID);
}
