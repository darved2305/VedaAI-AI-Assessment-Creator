import { Router, Request, Response } from "express";
import { Assignment } from "../models/Assignment";
import { Paper } from "../models/Paper";
import { enqueueVariantGeneration } from "../workers/variant-generate.worker";

const router = Router();

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { assignmentId, config } = req.body as {
      assignmentId: string;
      config: {
        count: number;
        shuffleQuestions: boolean;
        shuffleMCQOptions: boolean;
        mutateNumericals: boolean;
        addQRWatermark: boolean;
      };
    };

    if (!assignmentId) return res.status(400).json({ success: false, error: "assignmentId is required" });

    const count = Math.min(Math.max(Number(config?.count ?? 3), 2), 6);

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment?.paperId) return res.status(404).json({ success: false, error: "Paper not found" });

    const paper = await Paper.findById(assignment.paperId).lean();
    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    const jobId = await enqueueVariantGeneration({
      assignmentId,
      paperId: assignment.paperId.toString(),
      originalPaper: {
        assignmentId,
        sections: paper.sections.map((s) => ({
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
      },
      config: {
        count,
        shuffleQuestions: config?.shuffleQuestions ?? true,
        shuffleMCQOptions: config?.shuffleMCQOptions ?? true,
        mutateNumericals: config?.mutateNumericals ?? true,
        addQRWatermark: config?.addQRWatermark ?? true,
      },
      paperMeta: {
        schoolName: paper.schoolName,
        subject: paper.subject,
        className: paper.className,
        timeAllowed: paper.timeAllowed,
        maxMarks: paper.maxMarks,
      },
    });

    return res.json({ success: true, data: { jobId } });
  } catch (err) {
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
