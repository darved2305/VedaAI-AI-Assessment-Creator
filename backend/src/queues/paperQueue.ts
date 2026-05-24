import { Queue } from "bullmq";
import Redis from "ioredis";

let paperQueue: Queue | null = null;

export function getPaperQueue(): Queue {
  if (!paperQueue) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined in environment variables");

    const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
    paperQueue = new Queue("paper-generation", { connection });
  }
  return paperQueue;
}

export const PAPER_JOB_NAME = "generate-paper";
