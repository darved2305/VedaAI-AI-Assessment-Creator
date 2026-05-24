import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import { Paper } from "../models/Paper";
import { broadcast } from "../websocket/wsManager";
import { connectDB } from "../config/db";
import { refineQuestionToBloomsLevel, computeBloomsDistribution, classifyBlooms } from "../lib/blooms";
import type { BloomsRebalanceJob } from "../types/jobs";
import type { BloomsLevel } from "../types/domain";

export const BLOOMS_REBALANCE_JOB_NAME = "rebalance-blooms";
export const BLOOMS_REBALANCE_QUEUE_NAME = "blooms-rebalance";

let rebalanceQueue: Queue | null = null;

function getRebalanceQueue(): Queue {
  if (!rebalanceQueue) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined");
    const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
    rebalanceQueue = new Queue(BLOOMS_REBALANCE_QUEUE_NAME, { connection });
  }
  return rebalanceQueue;
}

const HIGHER_ORDER: BloomsLevel[] = ["Apply", "Analyze", "Evaluate", "Create"];

export function startBloomsRebalanceWorker(): Worker {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined");

  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });

  const worker = new Worker(
    BLOOMS_REBALANCE_QUEUE_NAME,
    async (job) => {
      if (job.name !== BLOOMS_REBALANCE_JOB_NAME) return;

      const data = job.data as BloomsRebalanceJob;
      const { assignmentId, paperId } = data;

      await connectDB();

      const paper = await Paper.findById(paperId);
      if (!paper) throw new Error(`Paper ${paperId} not found`);

      const allQuestions = paper.sections.flatMap((s) => s.questions);
      const recallQuestions = allQuestions.filter(
        (q) => q.bloomsLevel === "Remember" || q.bloomsLevel === "Understand" || !q.bloomsLevel
      );

      const toReplace = recallQuestions.slice(0, Math.ceil(recallQuestions.length * 0.4));

      let higherOrderIdx = 0;
      for (const q of toReplace) {
        const targetLevel = HIGHER_ORDER[higherOrderIdx % HIGHER_ORDER.length];
        higherOrderIdx++;

        const sectionForQ = paper.sections.find((s) =>
          s.questions.some((sq) => sq.number === q.number)
        );
        const sectionContext = sectionForQ
          ? `${sectionForQ.label} – ${sectionForQ.instruction.split("\n")[0]}`
          : "General Section";

        try {
          const rewritten = await refineQuestionToBloomsLevel(q, targetLevel, sectionContext);

          for (const section of paper.sections) {
            const idx = section.questions.findIndex((sq) => sq.number === q.number);
            if (idx !== -1) {
              section.questions[idx] = rewritten;
              break;
            }
          }
        } catch (err) {
          console.warn(`Failed to rewrite question ${q.number}:`, (err as Error).message);
        }
      }

      const updatedQuestions = paper.sections.flatMap((s) => s.questions);
      let reclassified = updatedQuestions;
      try {
        reclassified = await classifyBlooms(updatedQuestions);
        let qi = 0;
        for (const section of paper.sections) {
          for (let i = 0; i < section.questions.length; i++) {
            section.questions[i] = reclassified[qi++];
          }
        }
      } catch {
        // keep existing levels
      }

      const distribution = computeBloomsDistribution(paper.sections.flatMap((s) => s.questions));
      paper.bloomsDistribution = distribution;
      paper.markModified("sections");
      await paper.save();

      broadcast({
        type: "BLOOMS_REBALANCE_DONE",
        assignmentId,
        updatedSections: paper.sections.map((s) => ({
          label: s.label,
          instruction: s.instruction,
          questions: s.questions.map((q) => ({
            number: q.number,
            text: q.text,
            difficulty: q.difficulty,
            marks: q.marks,
            type: q.type,
            options: q.options,
            bloomsLevel: q.bloomsLevel,
          })),
        })),
        distribution,
      });
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const data = job.data as BloomsRebalanceJob;
    broadcast({
      type: "BLOOMS_REBALANCE_ERROR",
      assignmentId: data.assignmentId,
      error: err.message,
    });
  });

  console.log("Bloom's rebalance worker started");
  return worker;
}

export async function enqueueBloomsRebalance(
  params: Omit<BloomsRebalanceJob, "jobId">
): Promise<string> {
  const jobId = new mongoose.Types.ObjectId().toString();
  const queue = getRebalanceQueue();
  await queue.add(BLOOMS_REBALANCE_JOB_NAME, { ...params, jobId }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
  });
  return jobId;
}
