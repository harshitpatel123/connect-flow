import { AuthPayload } from "modules/auth/domain/auth.types";
import { feedService } from "../../../apps/api/services";

type Context = {
  user?: AuthPayload;
};

export const FeedResolver = {
  Query: {
    myFeed: async (_: unknown, __: unknown, { user }: Context) => {
      if (!user) throw new Error("Unauthorized");
      return feedService.getMyFeed(user.userId);
    }
  }
};
