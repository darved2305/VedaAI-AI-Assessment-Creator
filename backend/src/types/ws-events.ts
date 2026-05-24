import type { BloomsDistribution, PaperVariant, QuestionObject, SectionObject } from "./domain";

export interface JobUpdateEvent {
  type: "job_update";
  assignmentId: string;
  status: "queued" | "processing" | "done" | "failed";
  paperId?: string;
  error?: string;
}

export interface QuestionRefineStartEvent {
  type: "QUESTION_REFINE_START";
  assignmentId: string;
  questionId: string;
  jobId: string;
}

export interface QuestionRefineTokenEvent {
  type: "QUESTION_REFINE_TOKEN";
  assignmentId: string;
  questionId: string;
  token: string;
}

export interface QuestionRefineDoneEvent {
  type: "QUESTION_REFINE_DONE";
  assignmentId: string;
  questionId: string;
  question: QuestionObject;
  version: number;
}

export interface QuestionRefineErrorEvent {
  type: "QUESTION_REFINE_ERROR";
  assignmentId: string;
  questionId: string;
  error: string;
}

export interface VariantProgressEvent {
  type: "VARIANT_PROGRESS";
  assignmentId: string;
  jobId: string;
  completed: number;
  total: number;
}

export interface VariantDoneEvent {
  type: "VARIANT_DONE";
  assignmentId: string;
  jobId: string;
  variants: PaperVariant[];
}

export interface VariantErrorEvent {
  type: "VARIANT_ERROR";
  assignmentId: string;
  jobId: string;
  error: string;
}

export interface BloomsClassifiedEvent {
  type: "BLOOMS_CLASSIFIED";
  assignmentId: string;
  distribution: BloomsDistribution;
}

export interface BloomsRebalanceDoneEvent {
  type: "BLOOMS_REBALANCE_DONE";
  assignmentId: string;
  updatedSections: SectionObject[];
  distribution: BloomsDistribution;
}

export interface BloomsRebalanceErrorEvent {
  type: "BLOOMS_REBALANCE_ERROR";
  assignmentId: string;
  error: string;
}

export type WsEvent =
  | JobUpdateEvent
  | QuestionRefineStartEvent
  | QuestionRefineTokenEvent
  | QuestionRefineDoneEvent
  | QuestionRefineErrorEvent
  | VariantProgressEvent
  | VariantDoneEvent
  | VariantErrorEvent
  | BloomsClassifiedEvent
  | BloomsRebalanceDoneEvent
  | BloomsRebalanceErrorEvent;
