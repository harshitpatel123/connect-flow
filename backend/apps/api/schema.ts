import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authSchema = readFileSync(
  join(__dirname, "../../modules/auth/api/auth.schema.graphql"),
  "utf8"
);

const postSchema = readFileSync(
  join(__dirname, "../../modules/post/api/post.schema.graphql"),
  "utf8"
);

const feedSchema = readFileSync(
  join(__dirname, "../../modules/feed/api/feed.schema.graphql"),
  "utf8"
)


export const typeDefs = authSchema + postSchema + feedSchema;