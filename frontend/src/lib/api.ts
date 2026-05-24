import axios from "axios";
import type { BloomsLevel } from "@/store/assignmentStore";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export interface ApiAssignment {
  _id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
  status: "queued" | "processing" | "done" | "failed";
  paperId?: string;
  questionTypes: { type: string; numQuestions: number; marks: number }[];
  instructions: string;
}

export interface ApiQuestion {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  type: string;
  options?: string[];
  bloomsLevel?: BloomsLevel;
}

export interface ApiPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: { label: string; instruction: string; questions: ApiQuestion[] }[];
  answerKey: string[];
  bloomsDistribution?: {
    Remember: number;
    Understand: number;
    Apply: number;
    Analyze: number;
    Evaluate: number;
    Create: number;
    recallPercentage: number;
  };
  message?: string;
}

export const assignmentsApi = {
  list: async (): Promise<ApiAssignment[]> => {
    const { data } = await api.get<{ success: boolean; data: ApiAssignment[] }>("/assignments");
    return data.data;
  },

  get: async (id: string): Promise<{ assignment: ApiAssignment; paper: ApiPaper | null }> => {
    const { data } = await api.get<{ success: boolean; data: { assignment: ApiAssignment; paper: ApiPaper | null } }>(`/assignments/${id}`);
    return data.data;
  },

  create: async (payload: FormData): Promise<{ assignmentId: string; status: string }> => {
    const { data } = await api.post<{ success: boolean; data: { assignmentId: string; status: string } }>("/assignments", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },

  getPaper: async (id: string): Promise<ApiPaper> => {
    const { data } = await api.get<{ success: boolean; data: ApiPaper }>(`/assignments/${id}/paper`);
    return data.data;
  },

  refineQuestion: async (
    assignmentId: string,
    payload: {
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
  ): Promise<{ jobId: string }> => {
    const { data } = await api.post<{ success: boolean; data: { jobId: string } }>(
      `/assignments/${assignmentId}/refine`,
      payload
    );
    return data.data;
  },

  getVersions: async (assignmentId: string, questionId: string): Promise<unknown[]> => {
    const { data } = await api.get<{ success: boolean; data: unknown[] }>(
      `/assignments/${assignmentId}/versions/${questionId}`
    );
    return data.data;
  },

  rebalance: async (
    assignmentId: string,
    targetDistribution?: Record<BloomsLevel, number>
  ): Promise<{ jobId: string }> => {
    const { data } = await api.post<{ success: boolean; data: { jobId: string } }>(
      `/assignments/${assignmentId}/rebalance`,
      { targetDistribution }
    );
    return data.data;
  },
};

export const variantsApi = {
  generate: async (
    assignmentId: string,
    config: {
      count: number;
      shuffleQuestions: boolean;
      shuffleMCQOptions: boolean;
      mutateNumericals: boolean;
      addQRWatermark: boolean;
    }
  ): Promise<{ jobId: string }> => {
    const { data } = await api.post<{ success: boolean; data: { jobId: string } }>(
      "/variants/generate",
      { assignmentId, config }
    );
    return data.data;
  },
};
