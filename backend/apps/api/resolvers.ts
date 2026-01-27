import { AuthResolver } from "../../modules/auth/api/auth.resolver";

export const resolvers = {
  Mutation: {
    ...AuthResolver.Mutation
  }
};
