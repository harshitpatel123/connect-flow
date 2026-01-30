import { logFeedData } from "./feed-debugger";

try {
  await logFeedData();
} finally {
  process.exit(0);
}