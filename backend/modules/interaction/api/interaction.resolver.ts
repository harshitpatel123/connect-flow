import { interactionService } from "apps/api/services";
import { postService } from "apps/api/services";
import { authService } from "apps/api/services";
import { AuthPayload } from "modules/auth/domain/auth.types";

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
