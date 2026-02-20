import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'interaction-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'interest-group' });

export async function connectKafka() {
  await producer.connect();
  await consumer.connect();
  console.log('✅ Kafka producer and consumer connected');
}
