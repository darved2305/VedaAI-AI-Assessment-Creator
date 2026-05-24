import mongoose, { Schema, Document } from "mongoose";
import type { BloomsDistribution, BloomsLevel } from "../types/domain";

export interface IQuestion {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  type: string;
  options?: string[];
  bloomsLevel?: BloomsLevel;
}

export interface ISection {
  label: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IQuestionVersion {
  version: number;
  question: IQuestion;
  instruction: string;
  createdAt: Date;
}

export interface IPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: string[];
  bloomsDistribution?: BloomsDistribution;
  questionVersions: Map<string, IQuestionVersion[]>;
  message?: string;
  rawPrompt?: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    number: { type: Number, required: true },
    text: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Moderate", "Challenging"], required: true },
    marks: { type: Number, required: true },
    type: { type: String, required: true },
    options: { type: [String] },
    bloomsLevel: {
      type: String,
      enum: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
    },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    label: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false }
);

const QuestionVersionSchema = new Schema<IQuestionVersion>(
  {
    version: { type: Number, required: true },
    question: { type: QuestionSchema, required: true },
    instruction: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BloomsDistributionSchema = new Schema(
  {
    Remember: { type: Number, default: 0 },
    Understand: { type: Number, default: 0 },
    Apply: { type: Number, default: 0 },
    Analyze: { type: Number, default: 0 },
    Evaluate: { type: Number, default: 0 },
    Create: { type: Number, default: 0 },
    recallPercentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const PaperSchema = new Schema<IPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    schoolName: { type: String, default: "Delhi Public School" },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    timeAllowed: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    answerKey: { type: [String], required: true },
    bloomsDistribution: { type: BloomsDistributionSchema },
    questionVersions: { type: Map, of: [QuestionVersionSchema], default: {} },
    message: { type: String },
    rawPrompt: { type: String },
  },
  { timestamps: true }
);

export const Paper = mongoose.model<IPaper>("Paper", PaperSchema);
