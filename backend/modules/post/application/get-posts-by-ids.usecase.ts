import { PostRepository } from "../infrastructure/post.repository";

export class GetPostsByIdsUseCase {
  constructor(private postRepository: PostRepository) {}

  async execute(ids: string[]) {
    console.log("\n📋 [GET POSTS BY IDS] Fetching posts for IDs:", ids.join(", "));
    const posts = await this.postRepository.findByIds(ids);
    console.log("✅ [GET POSTS BY IDS] Retrieved", posts.length, "posts\n");
    return posts;
  }
}
