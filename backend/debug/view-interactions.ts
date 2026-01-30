import { logInteractionData, logInteractionKafkaEvents } from "./interaction-debugger";

try {
  await logInteractionData();
  await logInteractionKafkaEvents();
} finally {
  process.exit(0);
}
