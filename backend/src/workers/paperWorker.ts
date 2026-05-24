import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import { Assignment } from "../models/Assignment";
import { Paper } from "../models/Paper";
import { generatePaper } from "../services/aiService";
import { broadcastJobUpdate } from "../websocket/wsManager";
import { connectDB } from "../config/db";
import { PAPER_JOB_NAME } from "../queues/paperQueue";

export function startPaperWorker(): Worker {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined in environment variables");

  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });

  const worker = new Worker(
    "paper-generation",
    async (job) => {
      if (job.name !== PAPER_JOB_NAME) return;

      const { assignmentId } = job.data as { assignmentId: string };
      await connectDB();

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

      await Assignment.findByIdAndUpdate(assignmentId, { status: "processing" });
      broadcastJobUpdate({ type: "job_update", assignmentId, status: "processing" });

      const paperData = await generatePaper(assignment, assignment.fileUrl);

      const paper = await Paper.create({
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
        schoolName: process.env.SCHOOL_NAME ?? "Delhi Public School, Sector-4, Bokaro",
        subject: paperData.subject,
        className: paperData.className,
        timeAllowed: paperData.timeAllowed,
        maxMarks: paperData.maxMarks,
        sections: paperData.sections,
        answerKey: paperData.answerKey,
        message: paperData.message,
      });

      // Only auto-generate title if the user left it as the placeholder
      const autoTitle = `${paperData.subject} – ${paperData.className} Assignment`;
      const finalTitle =
        !assignment.title || assignment.title === "New Assignment"
          ? autoTitle
          : assignment.title;

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: "done",
        paperId: paper._id,
        title: finalTitle,
      });

      broadcastJobUpdate({
        type: "job_update",
        assignmentId,
        status: "done",
        paperId: (paper._id as mongoose.Types.ObjectId).toString(),
      });
    },
    { connection, concurrency: 3 }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const { assignmentId } = job.data as { assignmentId: string };
    await connectDB();
    await Assignment.findByIdAndUpdate(assignmentId, { status: "failed" });
    broadcastJobUpdate({ type: "job_update", assignmentId, status: "failed", error: err.message });
    console.error(`Paper job failed for assignment ${assignmentId}:`, err.message);
  });

  console.log("Paper generation worker started");
  return worker;
}
