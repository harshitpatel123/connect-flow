import { rerankConsumer } from './kafka.client.js';
import { RerankFeedUseCase } from '../application/rerank-feed.usecase.js';

export async function startReRankConsumer(rerankFeedUseCase: RerankFeedUseCase) {
  try {
    await rerankConsumer.subscribe({
      topics: ['user-interests-updated'],
      fromBeginning: false
    });

    await rerankConsumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        const { userId } = event;

        await rerankFeedUseCase.execute(userId);
      }
    });

    console.log('✅ Re-rank consumer started');
  } catch (error: any) {
    if (error.type !== 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.error('Re-rank consumer error:', error);
    }
  }
}
