import { producer } from './kafka.client.js';
import { PostCreatedEvent } from '../domain/types.js';

export class PostEventPublisher {
  async publishPostCreated(event: Omit<PostCreatedEvent, 'type'>): Promise<void> {
    const fullEvent: PostCreatedEvent = {
      type: 'PostCreated',
      ...event
    };

    await producer.send({
      topic: 'post-created',
      messages: [{ 
        key: event.postId,
        value: JSON.stringify(fullEvent) 
      }]
    });

    console.log(`[KAFKA] ✅ Published post-created event: postId=${event.postId}, userId=${event.userId}`);
  }
}
