import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import { Paper } from "../models/Paper";
import { refineQuestionStreaming } from "../services/aiService";
import { classifyBlooms } from "../lib/blooms";
import { broadcast } from "../websocket/wsManager";
import { connectDB } from "../config/db";
import { getRedisClient } from "../config/redis";
import { REDIS_KEYS } from "../lib/redis-keys";
import type { QuestionRefineJob } from "../types/jobs";
import type { IQuestion } from "../models/Paper";

export const QUESTION_REFINE_JOB_NAME = "refine-question";
export const QUESTION_REFINE_QUEUE_NAME = "question-refine";

export function startQuestionRefineWorker(): Worker {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined");

  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });

  const worker = new Worker(
    QUESTION_REFINE_QUEUE_NAME,
    async (job) => {
      if (job.name !== QUESTION_REFINE_JOB_NAME) return;

      const data = job.data as QuestionRefineJob;
      const { assignmentId, paperId, questionId, originalQuestion, instruction, sectionContext, jobId } = data;

      await connectDB();

      broadcast({
        type: "QUESTION_REFINE_START",
        assignmentId,
        questionId,
        jobId,
      });

      let refined: {
        text: string;
        difficulty: "Easy" | "Moderate" | "Challenging";
        marks: number;
        type: string;
        options?: string[];
        changeReason: string;
      };

      try {
        refined = await refineQuestionStreaming({
          originalQuestion,
          instruction,
          sectionContext,
          onToken: (token) => {
            broadcast({
              type: "QUESTION_REFINE_TOKEN",
              assignmentId,
              questionId,
              token,
            });
          },
        });
      } catch (err) {
        broadcast({
          type: "QUESTION_REFINE_ERROR",
          assignmentId,
          questionId,
          error: (err as Error).message,
        });
        throw err;
      }

      const updatedQuestion: IQuestion = {
        number: originalQuestion.number,
        text: refined.text,
        difficulty: refined.difficulty,
        marks: refined.marks,
        type: refined.type,
        options: refined.options ?? originalQuestion.options,
      };

      try {
        const [classified] = await classifyBlooms([updatedQuestion]);
        if (classified) updatedQuestion.bloomsLevel = classified.bloomsLevel;
      } catch {
        // non-fatal
      }

      const paper = await Paper.findById(paperId);
      if (!paper) throw new Error(`Paper ${paperId} not found`);

      const versions = paper.questionVersions.get(questionId) ?? [];
      const nextVersion = versions.length + 1;

      versions.push({
        version: nextVersion,
        question: updatedQuestion,
        instruction,
        createdAt: new Date(),
      });

      paper.questionVersions.set(questionId, versions);

      for (const section of paper.sections) {
        const idx = section.questions.findIndex(
          (q) => q.number === originalQuestion.number
        );
        if (idx !== -1) {
          section.questions[idx] = updatedQuestion;
          break;
        }
      }

      paper.markModified("questionVersions");
      paper.markModified("sections");
      await paper.save();

      const redis = getRedisClient();
      const cacheKey = REDIS_KEYS.questionVersions(assignmentId, questionId);
      const last5 = versions.slice(-5);
      await redis.setex(cacheKey, 86400, JSON.stringify(last5));

      broadcast({
        type: "QUESTION_REFINE_DONE",
        assignmentId,
        questionId,
        question: {
          number: updatedQuestion.number,
          text: updatedQuestion.text,
          difficulty: updatedQuestion.difficulty,
          marks: updatedQuestion.marks,
          type: updatedQuestion.type,
          options: updatedQuestion.options,
          bloomsLevel: updatedQuestion.bloomsLevel,
        },
        version: nextVersion,
      });
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const data = job.data as QuestionRefineJob;
    broadcast({
      type: "QUESTION_REFINE_ERROR",
      assignmentId: data.assignmentId,
      questionId: data.questionId,
      error: err.message,
    });
  });

  console.log("Question refine worker started");
  return worker;
}

export async function enqueueQuestionRefine(
  params: Omit<QuestionRefineJob, "jobId">
): Promise<string> {
  const { Queue } = await import("bullmq");
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined");

  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  const queue = new Queue(QUESTION_REFINE_QUEUE_NAME, { connection });

  const jobId = new mongoose.Types.ObjectId().toString();
  await queue.add(QUESTION_REFINE_JOB_NAME, { ...params, jobId }, {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
  });

  return jobId;
}
