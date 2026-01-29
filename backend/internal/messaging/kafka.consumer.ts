import { kafka } from "./kafka.client";

export function createConsumer(groupId: string) {
  return kafka.consumer({ groupId });
}
