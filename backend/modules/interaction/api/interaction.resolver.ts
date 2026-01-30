import { interactionService } from "apps/api/services";
import { postService } from "apps/api/services";
import { authService } from "apps/api/services";
import { AuthPayload } from "modules/auth/domain/auth.types";
import { prisma } from "internal/database/prisma.client";
import { likeStore } from "internal/cache/like.store";
import { seenStore } from "internal/cache/seen.store";

type Context = {
  user?: AuthPayload;
};

export const InteractionResolver = {
  Query: {
    postLikes: async (_: unknown, { postId }: { postId: string }) => {
      try {
        console.log("🔍 [INTERACTION RESOLVER] Fetching likes for post:", postId);
        const likes = await postService.getPostLikes(postId);
        console.log("📊 [INTERACTION RESOLVER] Found likes:", likes?.length || 0);
        
        if (!likes || likes.length === 0) return [];
        
        const userIds = [...new Set(likes.map(l => l.userId))];
        const users = await authService.getUsersByIds(userIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        return likes.map(like => ({ ...like, user: userMap.get(like.userId) }));
      } catch (error) {
        console.error("❌ [INTERACTION RESOLVER] Error fetching post likes:", error);
        return [];
      }
    },
    postComments: async (_: unknown, { postId }: { postId: string }) => {
      try {
        console.log("🔍 [INTERACTION RESOLVER] Fetching comments for post:", postId);
        const comments = await postService.getPostComments(postId);
        console.log("📊 [INTERACTION RESOLVER] Found comments:", comments?.length || 0);
        
        if (!comments || comments.length === 0) return [];
        
        const userIds = [...new Set(comments.map(c => c.userId))];
        const users = await authService.getUsersByIds(userIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        return comments.map(comment => ({ ...comment, user: userMap.get(comment.userId) }));
      } catch (error) {
        console.error("❌ [INTERACTION RESOLVER] Error fetching post comments:", error);
        return [];
      }
    },
    myInteractionHistory: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      
      try {
        const likes = await prisma.postLike.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
          select: { postId: true }
        });
        
        const comments = await prisma.comment.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
          select: { postId: true }
        });
        
        const likedPostIds = [...new Set(likes.map(l => l.postId))];
        const commentedPostIds = [...new Set(comments.map(c => c.postId))];
        
        const [likedPosts, commentedPosts] = await Promise.all([
          postService.getPostsByIds(likedPostIds),
          postService.getPostsByIds(commentedPostIds)
        ]);
        
        const allUserIds = [...new Set([...likedPosts.map(p => p.userId), ...commentedPosts.map(p => p.userId)])];
        const users = await authService.getUsersByIds(allUserIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        
        const enrichPosts = async (posts: any[]) => {
          return Promise.all(posts.map(async (post) => {
            const likeCount = await likeStore.getLikeCount(post.id) || post.likeCount;
            const viewCount = await seenStore.getViewCount(post.id) || Number(post.viewCount);
            const isLiked = await likeStore.hasLiked(user.userId, post.id);
            return {
              ...post,
              likeCount,
              viewCount,
              commentCount: post.commentCount,
              isLiked,
              user: userMap.get(post.userId)
            };
          }));
        };
        
        return {
          likedPosts: await enrichPosts(likedPosts),
          commentedPosts: await enrichPosts(commentedPosts)
        };
      } catch (error) {
        console.error("❌ [INTERACTION RESOLVER] Error fetching interaction history:", error);
        return { likedPosts: [], commentedPosts: [] };
      }
    },
  },
  Mutation: {
    likePost: async (_: unknown, { postId }: { postId: string }, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      console.log("🔵 [INTERACTION RESOLVER] likePost called");
      return await interactionService.likePost(user.userId, postId);
    },
    unlikePost: async (_: unknown, { postId }: { postId: string }, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      console.log("🔵 [INTERACTION RESOLVER] unlikePost called");
      return await interactionService.unlikePost(user.userId, postId);
    },
    viewPost: async (_: unknown, { postId }: { postId: string }, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      console.log("🔵 [INTERACTION RESOLVER] viewPost called");
      return await interactionService.viewPost(user.userId, postId);
    },
    commentPost: async (_: unknown, { postId, content }: { postId: string; content: string }, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      console.log("🔵 [INTERACTION RESOLVER] commentPost called");
      await interactionService.commentPost(user.userId, postId, content);
      return true;
    },
  },
};
