import { consumer } from './kafka.client.js';
import { InteractionRepository } from '../infrastructure/interaction.repository.js';
import { InteractionEventProducer } from './interaction-event.producer.js';
import { getServiceUrl } from '../config/consul.js';
import axios from 'axios';

export async function startInterestConsumer(
  repository: InteractionRepository,
  eventProducer: InteractionEventProducer
) {
  try {
    await consumer.subscribe({
      topics: ['post-liked', 'post-unliked', 'post-commented'],
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        const { userId, postId } = event;

        try {
          const postServiceUrl = await getServiceUrl('post-service');
          const response = await axios.get(`${postServiceUrl}/posts/${postId}`);
          const post = response.data;

          if (!post || !post.categoryTags || post.categoryTags.length === 0) return;

          let scoreChange = 0;
          switch (topic) {
            case 'post-liked':
              scoreChange = 5;
              break;
            case 'post-unliked':
              scoreChange = -5;
              break;
            case 'post-commented':
              scoreChange = 10;
              break;
          }

          for (const category of post.categoryTags) {
            await repository.upsertInterest(userId, category, scoreChange);
          }

          await eventProducer.userInterestsUpdated(userId, postId);
        } catch (error) {
          console.error('Interest consumer error:', error);
        }
      }
    });

    console.log('✅ Interest consumer started');
  } catch (error: any) {
    if (error.type !== 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.error('Interest consumer error:', error);
    }
  }
}
