import axios from "axios";

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

export interface ApiPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: {
    label: string;
    instruction: string;
    questions: {
      number: number;
      text: string;
      difficulty: "Easy" | "Moderate" | "Challenging";
      marks: number;
      type: string;
      options?: string[];
    }[];
  }[];
  answerKey: string[];
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
};
