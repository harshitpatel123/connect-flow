import { producer } from './kafka.client.js';

export class InteractionEventProducer {
  async postLiked(userId: string, postId: string) {
    await producer.send({
      topic: 'post-liked',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
  }

  async postUnliked(userId: string, postId: string) {
    await producer.send({
      topic: 'post-unliked',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
  }

  async postCommented(userId: string, postId: string) {
    await producer.send({
      topic: 'post-commented',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
  }

  async userInterestsUpdated(userId: string, postId: string) {
    await producer.send({
      topic: 'user-interests-updated',
      messages: [{ value: JSON.stringify({ userId, postId }) }]
    });
  }
}
