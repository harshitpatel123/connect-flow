import { kafka } from "./kafka.client";

export const producer = kafka.producer();

export async function connectProducer() {
  console.log("🔌 [KAFKA PRODUCER] Connecting...");
  await producer.connect();
  console.log("✅ [KAFKA PRODUCER] Connected successfully\n");
}
