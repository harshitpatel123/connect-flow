import { producer } from './kafka.client.js';

export class InteractionEventProducer {
  async postLiked(userId: string, postId: string) {
    await producer.send({
      topic: 'post-liked',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
    console.log(`[KAFKA] ✅ Published post-liked: user=${userId}, post=${postId}`);
  }

  async postUnliked(userId: string, postId: string) {
    await producer.send({
      topic: 'post-unliked',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
    console.log(`[KAFKA] ✅ Published post-unliked: user=${userId}, post=${postId}`);
  }

  async postCommented(userId: string, postId: string) {
    await producer.send({
      topic: 'post-commented',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
    console.log(`[KAFKA] ✅ Published post-commented: user=${userId}, post=${postId}`);
  }

  async userInterestsUpdated(userId: string, postId: string) {
    await producer.send({
      topic: 'user-interests-updated',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
    console.log(`[KAFKA] ✅ Published user-interests-updated: user=${userId}, post=${postId}`);
  }

  async postViewed(userId: string, postId: string) {
    await producer.send({
      topic: 'post-viewed',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
    console.log(`[KAFKA] ✅ Published post-viewed: user=${userId}, post=${postId}`);
  }
}
