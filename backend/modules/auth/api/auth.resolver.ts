import { authService } from "apps/api/services";
import { AuthPayload } from "modules/auth/domain/auth.types";

type Context = {
  user?: AuthPayload;
};

export const AuthResolver = {
  Query: {
    getUser: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      console.log("🔍 [AUTH RESOLVER] getUser called for user ID:", user.userId);
      return authService.getUser(user.userId);
    }
  },
  Mutation: {
    register: async (_: unknown, args: { email: string; password: string }) => {
      return authService.register(args);
    },
    login: async (_: unknown, args: { email: string; password: string }) => {
      return authService.login(args);
    }
  }
};
