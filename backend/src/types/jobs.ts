import type { BloomsLevel, BloomsDistribution, SectionObject } from "./domain";

export interface QuestionRefineJob {
  jobId: string;
  assignmentId: string;
  paperId: string;
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
}

export interface VariantGenerateJob {
  jobId: string;
  assignmentId: string;
  paperId: string;
  originalPaper: {
    assignmentId: string;
    sections: SectionObject[];
  };
  config: {
    count: number;
    shuffleQuestions: boolean;
    shuffleMCQOptions: boolean;
    mutateNumericals: boolean;
    addQRWatermark: boolean;
  };
}

export interface BloomsRebalanceJob {
  jobId: string;
  assignmentId: string;
  paperId: string;
  targetDistribution: Record<BloomsLevel, number>;
}
