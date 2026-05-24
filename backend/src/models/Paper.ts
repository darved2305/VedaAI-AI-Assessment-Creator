import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  type: string;
  options?: string[];
}

export interface ISection {
  label: string;
  instruction: string;
  questions: IQuestion[];
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
    message: { type: String },
    rawPrompt: { type: String },
  },
  { timestamps: true }
);

export const Paper = mongoose.model<IPaper>("Paper", PaperSchema);
