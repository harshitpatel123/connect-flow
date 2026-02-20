import { authClient } from '../services/authClient';
import { postClient } from '../services/postClient';
import { interactionClient } from '../services/interactionClient';
import { feedClient } from '../services/feedClient';
import { enrichPosts } from '../services/postEnricher';

export const resolvers = {
  Query: {
    // Auth Queries
    getUser: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return authClient.getUserById(context.userId, context.requestId);
    },

    // Post Queries
    myPosts: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      const posts = await postClient.getMyPosts(context.userId, context.requestId);
      return enrichPosts(posts, context.userId);
    },

    postsByIds: async (_: any, { ids }: { ids: string[] }, context: any) => {
      const posts = await postClient.getPostsByIds(ids, context.requestId);
      return enrichPosts(posts, context.userId);
    },

    // Feed Queries
    myFeed: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      const posts = await feedClient.getMyFeed(context.userId, context.requestId);
      return enrichPosts(posts, context.userId);
    },

    // Interaction Queries
    postLikes: async (_: any, { postId }: { postId: string }, context: any) => {
      return interactionClient.getPostLikes(postId, context.requestId);
    },

    postComments: async (_: any, { postId }: { postId: string }, context: any) => {
      return interactionClient.getPostComments(postId, context.requestId);
    },

    myInteractionHistory: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      
      // Get liked and commented post IDs from interaction service
      const history = await interactionClient.getMyInteractionHistory(context.userId, context.requestId);
      const { likedPostIds, commentedPostIds } = history;
      
      // Fetch posts for both lists
      const [likedPosts, commentedPosts] = await Promise.all([
        likedPostIds.length > 0 ? postClient.getPostsByIds(likedPostIds, context.requestId) : [],
        commentedPostIds.length > 0 ? postClient.getPostsByIds(commentedPostIds, context.requestId) : []
      ]);
      
      // Enrich both lists
      return {
        likedPosts: await enrichPosts(likedPosts, context.userId),
        commentedPosts: await enrichPosts(commentedPosts, context.userId)
      };
    },
  },

  Mutation: {
    // Auth Mutations
    register: async (_: any, { email, password }: { email: string; password: string }, context: any) => {
      return authClient.register(email, password, context.requestId);
    },

    login: async (_: any, { email, password }: { email: string; password: string }, context: any) => {
      return authClient.login(email, password, context.requestId);
    },

    // Post Mutations
    createPost: async (_: any, { content, categoryTags }: { content: string; categoryTags?: string[] }, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      const post = await postClient.createPost(context.userId, content, categoryTags || [], context.requestId);
      const enriched = await enrichPosts([post], context.userId);
      return enriched[0];
    },

    // Interaction Mutations
    likePost: async (_: any, { postId }: { postId: string }, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return interactionClient.likePost(context.userId, postId, context.requestId);
    },

    unlikePost: async (_: any, { postId }: { postId: string }, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return interactionClient.unlikePost(context.userId, postId, context.requestId);
    },

    viewPost: async (_: any, { postId }: { postId: string }, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return interactionClient.viewPost(context.userId, postId, context.requestId);
    },

    commentPost: async (_: any, { postId, content }: { postId: string; content: string }, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return interactionClient.commentPost(context.userId, postId, content, context.requestId);
    },

    // Feed Mutations
    regenerateFeed: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      const posts = await feedClient.regenerateFeed(context.userId, context.requestId);
      return enrichPosts(posts, context.userId);
    },
  },
};
