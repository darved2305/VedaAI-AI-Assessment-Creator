import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionType {
  type: string;
  numQuestions: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  dueDate: string;
  questionTypes: IQuestionType[];
  instructions: string;
  fileUrl?: string;
  status: "queued" | "processing" | "done" | "failed";
  paperId?: mongoose.Types.ObjectId;
  assignedOn: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>(
  {
    type: { type: String, required: true },
    numQuestions: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: String, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    instructions: { type: String, default: "" },
    fileUrl: { type: String },
    status: {
      type: String,
      enum: ["queued", "processing", "done", "failed"],
      default: "queued",
    },
    paperId: { type: Schema.Types.ObjectId, ref: "Paper" },
    assignedOn: { type: String, required: true },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>("Assignment", AssignmentSchema);
