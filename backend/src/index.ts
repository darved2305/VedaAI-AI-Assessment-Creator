import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

import { connectDB } from "./config/db";
import { getRedisClient } from "./config/redis";
import { initWebSocket } from "./websocket/wsManager";
import { startPaperWorker } from "./workers/paperWorker";
import assignmentRoutes from "./routes/assignments";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/assignments", assignmentRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

/* Retry helper — keeps retrying until connected */
async function connectWithRetry(label: string, fn: () => Promise<void>, intervalMs = 5000) {
  while (true) {
    try {
      await fn();
      return;
    } catch (err) {
      console.error(`[${label}] connection failed — retrying in ${intervalMs / 1000}s:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

async function bootstrap() {
  const server = http.createServer(app);
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`VedaAI backend running on http://localhost:${PORT}`);
    console.log("Connecting to MongoDB and Redis...");
  });

  /*
   * Graceful shutdown — critical for ts-node-dev hot reload on Windows.
   * ts-node-dev sends SIGUSR2 before restarting the child process.
   * Without closing the server first, the port stays held and the next
   * restart fails with EADDRINUSE.
   */
  process.once("SIGUSR2", () => {
    server.close(() => {
      process.kill(process.pid, "SIGUSR2");
    });
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });

  // Connect to MongoDB with retry (non-blocking)
  connectWithRetry("MongoDB", connectDB).then(() => {
    try {
      startPaperWorker();
    } catch (err) {
      console.error("BullMQ worker failed to start:", (err as Error).message);
    }
  });

  // Connect Redis with retry (non-blocking)
  connectWithRetry("Redis", async () => {
    const client = getRedisClient();
    await client.ping();
  });
}

bootstrap();
