import { feedConsumer } from './kafka.client.js';
import { BuildFeedUseCase } from '../application/build-feed.usecase.js';
import { PostServiceClient } from '../clients/post-service.client.js';
import { InteractionServiceClient } from '../clients/interaction-service.client.js';

export async function startFeedConsumer(
  buildFeedUseCase: BuildFeedUseCase,
  postClient: PostServiceClient,
  interactionClient: InteractionServiceClient
) {
  try {
    await feedConsumer.subscribe({ topic: 'post-created', fromBeginning: false });

    await feedConsumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());
        if (event.type !== 'PostCreated') return;

        const post = await postClient.getPostById(event.postId);
        if (!post || !post.categoryTags || post.categoryTags.length === 0) return;

        const MIN_AFFINITY_SCORE = 0;
        const qualifiedUsers = await interactionClient.getQualifiedUsers(
          post.categoryTags,
          MIN_AFFINITY_SCORE
        );

        for (const user of qualifiedUsers) {
          await buildFeedUseCase.execute(
            user.userId,
            event.postId,
            event.createdAt,
            post.categoryTags
          );
        }
      }
    });

    console.log('✅ Feed consumer started');
  } catch (error: any) {
    if (error.type !== 'UNKNOWN_TOPIC_OR_PARTITION') {
      console.error('Feed consumer error:', error);
    }
  }
}
