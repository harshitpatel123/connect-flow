import { AuthService } from "../authService";

type Context = {
  authService: AuthService;
};

export const AuthResolver = {
  Mutation: {
    register: async (_: unknown, args: { email: string; password: string }, context: Context) => {
      return context.authService.register(args);
    },
    login: async (_: unknown, args: { email: string; password: string }, context: Context) => {
      return context.authService.login(args);
    }
  }
};
