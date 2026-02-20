import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'feed-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

export const feedConsumer = kafka.consumer({ groupId: 'feed-group' });
export const rerankConsumer = kafka.consumer({ groupId: 'rerank-group' });

export async function connectKafka() {
  await feedConsumer.connect();
  await rerankConsumer.connect();
  console.log('✅ Kafka consumers connected');
}
