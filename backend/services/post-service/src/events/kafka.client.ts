import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'post-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

export const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
  console.log('✅ Kafka producer connected');
}
