import { AuthPayload } from "modules/auth/domain/auth.types";
import { feedService } from "../../../apps/api/services";
import { postService } from "../../../apps/api/services";
import { authService } from "../../../apps/api/services";
import { likeStore } from "internal/cache/like.store";
import { seenStore } from "internal/cache/seen.store";
import { prisma } from "internal/database/prisma.client";

type Context = {
  user?: AuthPayload;
};

async function getPostCounts(postId: string, dbLikeCount: number, dbViewCount: bigint, dbCommentCount: number) {
  try {
    const likeCount = await likeStore.getLikeCount(postId);
    const viewCount = await seenStore.getViewCount(postId);
    return {
      likeCount: likeCount || dbLikeCount,
      viewCount: viewCount || Number(dbViewCount),
      commentCount: dbCommentCount,
    };
  } catch (error) {
    console.error("Redis failed, using DB counts", error);
    return {
      likeCount: dbLikeCount,
      viewCount: Number(dbViewCount),
      commentCount: dbCommentCount,
    };
  }
}

async function checkIsLiked(userId: string, postId: string): Promise<boolean> {
  try {
    return await likeStore.hasLiked(userId, postId);
  } catch (error) {
    console.error("Redis failed for isLiked, checking DB", error);
    const like = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } }
    });
    return !!like;
  }
}

export const FeedResolver = {
  Query: {
    myFeed: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      
      const feedItems = await feedService.getMyFeed(user.userId);
      const postIds = feedItems.map(item => item.postId);
      
      if (postIds.length === 0) return [];
      
      const posts = await postService.getPostsByIds(postIds);
      const userIds = [...new Set(posts.map(p => p.userId))];
      const users = await authService.getUsersByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      
      const postsWithCounts = await Promise.all(
        posts.map(async (post) => {
          const counts = await getPostCounts(post.id, post.likeCount, post.viewCount, post.commentCount);
          const isLiked = await checkIsLiked(user.userId, post.id);
          return {
            ...post,
            ...counts,
            isLiked,
            user: userMap.get(post.userId)
          };
        })
      );
      
      return postsWithCounts;
    }
  }
};
