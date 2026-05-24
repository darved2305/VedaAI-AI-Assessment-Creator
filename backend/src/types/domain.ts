export type BloomsLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";

export interface BloomsDistribution {
  Remember: number;
  Understand: number;
  Apply: number;
  Analyze: number;
  Evaluate: number;
  Create: number;
  recallPercentage: number;
}

export interface QuestionObject {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  type: string;
  options?: string[];
  bloomsLevel?: BloomsLevel;
}

export interface QuestionVersion {
  version: number;
  question: QuestionObject;
  instruction: string;
  createdAt: Date;
}

export interface SectionObject {
  label: string;
  instruction: string;
  questions: QuestionObject[];
}

export interface PaperVariant {
  variantId: string;
  label: string;
  assignmentId: string;
  sections: SectionObject[];
  qrPayload: string | null;
  createdAt: Date;
}
