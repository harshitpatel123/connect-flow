import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'interaction-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'interaction-group' });

export async function connectKafka() {
  await producer.connect();
  console.log('✅ Kafka producer connected');
}
