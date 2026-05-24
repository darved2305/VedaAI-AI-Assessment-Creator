import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { Assignment } from "../models/Assignment";
import { Paper } from "../models/Paper";
import { getPaperQueue, PAPER_JOB_NAME } from "../queues/paperQueue";
import { getRedisClient } from "../config/redis";
import { REDIS_KEYS } from "../lib/redis-keys";
import { enqueueQuestionRefine } from "../workers/question-refine.worker";
import { enqueueBloomsRebalance } from "../workers/blooms-rebalance.worker";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only JPEG, PNG and PDF files are allowed"));
  },
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(REDIS_KEYS.assignmentsAll);

    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();
    await redis.setex(REDIS_KEYS.assignmentsAll, 30, JSON.stringify(assignments));

    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });

    const paper = assignment.paperId
      ? await Paper.findById(assignment.paperId).lean()
      : null;

    return res.json({ success: true, data: { assignment, paper } });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { dueDate, questionTypes, instructions, title } = req.body;

    if (!dueDate) return res.status(400).json({ success: false, error: "dueDate is required" });
    if (!questionTypes) return res.status(400).json({ success: false, error: "questionTypes is required" });

    let parsedQTypes: { type: string; numQuestions: number; marks: number }[];
    try {
      parsedQTypes = typeof questionTypes === "string" ? JSON.parse(questionTypes) : questionTypes;
    } catch {
      return res.status(400).json({ success: false, error: "questionTypes must be valid JSON" });
    }

    for (const q of parsedQTypes) {
      if (!q.type || q.numQuestions < 1 || q.marks < 1) {
        return res.status(400).json({
          success: false,
          error: "Each question type must have a name, numQuestions ≥ 1, and marks ≥ 1",
        });
      }
    }

    const today = new Date();
    const assignedOn = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

    const assignment = await Assignment.create({
      title: title ?? "New Assignment",
      dueDate,
      questionTypes: parsedQTypes,
      instructions: instructions ?? "",
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      status: "queued",
      assignedOn,
    });

    const queue = getPaperQueue();
    await queue.add(PAPER_JOB_NAME, { assignmentId: assignment._id.toString() }, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.assignmentsAll);

    return res.status(201).json({
      success: true,
      data: { assignmentId: assignment._id.toString(), status: "queued" },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });

    if (assignment.paperId) {
      await Paper.findByIdAndDelete(assignment.paperId);
    }

    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.assignmentsAll);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get("/:id/paper", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });

    if (!assignment.paperId) {
      return res.status(404).json({ success: false, error: "Paper not yet generated" });
    }

    const paper = await Paper.findById(assignment.paperId).lean();
    return res.json({ success: true, data: paper });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post("/:id/refine", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });
    if (!assignment.paperId) return res.status(404).json({ success: false, error: "Paper not yet generated" });

    const { questionId, originalQuestion, instruction, sectionContext } = req.body as {
      questionId: string;
      originalQuestion: {
        text: string;
        difficulty: "Easy" | "Moderate" | "Challenging";
        marks: number;
        type: string;
        number: number;
        options?: string[];
      };
      instruction: string;
      sectionContext: string;
    };

    if (!questionId || !originalQuestion || !instruction) {
      return res.status(400).json({ success: false, error: "questionId, originalQuestion, and instruction are required" });
    }

    const jobId = await enqueueQuestionRefine({
      assignmentId: req.params.id,
      paperId: assignment.paperId.toString(),
      questionId,
      originalQuestion,
      instruction,
      sectionContext: sectionContext ?? "General Section",
    });

    return res.json({ success: true, data: { jobId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.get("/:id/versions/:questionId", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment?.paperId) return res.status(404).json({ success: false, error: "Paper not found" });

    const redis = getRedisClient();
    const cacheKey = REDIS_KEYS.questionVersions(req.params.id, req.params.questionId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    const paper = await Paper.findById(assignment.paperId).lean();
    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    const versions = (paper.questionVersions as unknown as Map<string, unknown>)?.get?.(req.params.questionId) ?? [];
    return res.json({ success: true, data: versions });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

router.post("/:id/rebalance", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment?.paperId) return res.status(404).json({ success: false, error: "Paper not found" });

    const targetDistribution = req.body.targetDistribution ?? {
      Remember: 10,
      Understand: 15,
      Apply: 25,
      Analyze: 25,
      Evaluate: 15,
      Create: 10,
    };

    const jobId = await enqueueBloomsRebalance({
      assignmentId: req.params.id,
      paperId: assignment.paperId.toString(),
      targetDistribution,
    });

    return res.json({ success: true, data: { jobId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
