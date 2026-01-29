import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "connectflow",
  brokers: ["localhost:9092"]
});
