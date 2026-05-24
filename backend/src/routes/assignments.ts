import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { Assignment } from "../models/Assignment";
import { Paper } from "../models/Paper";
import { getPaperQueue, PAPER_JOB_NAME } from "../queues/paperQueue";
import { getRedisClient } from "../config/redis";

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

// GET /assignments — list all assignments
router.get("/", async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const cacheKey = "assignments:all";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    const assignments = await Assignment.find().sort({ createdAt: -1 }).lean();
    await redis.setex(cacheKey, 30, JSON.stringify(assignments));

    return res.json({ success: true, data: assignments });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /assignments/:id — get single assignment + paper
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

// POST /assignments — create assignment and queue paper generation
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

    // Invalidate cache
    const redis = getRedisClient();
    await redis.del("assignments:all");

    return res.status(201).json({
      success: true,
      data: { assignmentId: assignment._id.toString(), status: "queued" },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE /assignments/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: "Assignment not found" });

    if (assignment.paperId) {
      await Paper.findByIdAndDelete(assignment.paperId);
    }

    const redis = getRedisClient();
    await redis.del("assignments:all");

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /assignments/:id/paper — get generated paper
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

export default router;
