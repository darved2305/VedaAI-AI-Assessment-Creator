import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined in environment variables");

    redisClient = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error", (err) => console.error("Redis error:", err));
  }
  return redisClient;
}

export function getRedisConnectionOptions() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined in environment variables");
  return { connection: new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false }) };
}
