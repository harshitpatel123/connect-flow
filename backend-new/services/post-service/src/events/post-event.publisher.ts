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
      messages: [{ value: JSON.stringify(fullEvent) }]
    });

    console.log('✅ Published post-created event:', event.postId);
  }
}
