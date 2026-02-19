import { authClient } from '../services/authClient';
import { postClient } from '../services/postClient';
import { interactionClient } from '../services/interactionClient';
import { feedClient } from '../services/feedClient';

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
      return postClient.getMyPosts(context.userId, context.requestId);
    },

    postsByIds: async (_: any, { ids }: { ids: string[] }, context: any) => {
      return postClient.getPostsByIds(ids, context.requestId);
    },

    // Feed Queries
    myFeed: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new Error('Unauthorized');
      }
      return feedClient.getMyFeed(context.userId, context.requestId);
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
      return interactionClient.getMyInteractionHistory(context.userId, context.requestId);
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
      return postClient.createPost(context.userId, content, categoryTags || [], context.requestId);
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
      return feedClient.regenerateFeed(context.userId, context.requestId);
    },
  },
};
