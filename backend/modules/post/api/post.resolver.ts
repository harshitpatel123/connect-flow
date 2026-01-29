import { postService } from "apps/api/services";
import { authService } from "apps/api/services";
import { AuthPayload } from "modules/auth/domain/auth.types";

type Context = {
  user?: AuthPayload;
};


export const PostResolver = {
  Query: {
    myPosts: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      return postService.getMyPosts(user.userId);
    },
    postsByIds: async (_: unknown, args: { ids: string[] }) => {
      const posts = await postService.getPostsByIds(args.ids);
      const userIds = [...new Set(posts.map(p => p.userId))];
      const users = await authService.getUsersByIds(userIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      
      return posts.map(post => ({
        ...post,
        user: userMap.get(post.userId)
      }));
    }
  },

  Mutation: {
    createPost: async (_: unknown, args: { content: string }, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");

      return postService.createPost({
        userId: user.userId,
        content: args.content
      });
    }
  }
};
