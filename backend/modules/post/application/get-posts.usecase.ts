import { PostRepository } from "../infrastructure/post.repository";

export class GetPostsUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(userId: string) {
    return this.postRepository.findByUser(userId);
  }
}
