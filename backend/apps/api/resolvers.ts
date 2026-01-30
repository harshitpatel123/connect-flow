import { PostResolver } from "modules/post/api/post.resolver";
import { AuthResolver } from "../../modules/auth/api/auth.resolver";
import { FeedResolver } from "modules/feed/api/feed.resolver";
import { InteractionResolver } from "modules/interaction/api/interaction.resolver";

export const resolvers = {
  Query: {
    ...AuthResolver.Query,
    ...PostResolver.Query,
    ...FeedResolver.Query,
    ...InteractionResolver.Query,
  },
  Mutation: {
    ...AuthResolver.Mutation,
    ...PostResolver.Mutation,
    ...InteractionResolver.Mutation
  }
};
