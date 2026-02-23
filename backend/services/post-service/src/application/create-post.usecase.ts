import { PostRepository } from '../infrastructure/post.repository.js';
import { PostEventPublisher } from '../events/post-event.publisher.js';
import { CreatePostInput, Post } from '../domain/types.js';

export class CreatePostUseCase {
  constructor(
    private postRepository: PostRepository,
    private postEventPublisher: PostEventPublisher
  ) {}

  async execute(input: CreatePostInput): Promise<Post> {
    const post = await this.postRepository.create(
      input.userId,
      input.content,
      input.categoryTags || []
    );

    try {
      await this.postEventPublisher.publishPostCreated({
        postId: post.id,
        userId: post.userId,
        createdAt: post.createdAt.getTime()
      });
    } catch (error) {
      console.error('Failed to publish post-created event:', error);
    }

    return post;
  }
}
