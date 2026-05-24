import { create } from "zustand";

export interface QuestionTypeRow {
  id: string;
  type: string;
  numQuestions: number;
  marks: number;
}

export interface FormState {
  title: string;
  dueDate: string;
  questionTypes: QuestionTypeRow[];
  instructions: string;
  file: File | null;
}

export interface Question {
  number: number;
  text: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: number;
  type: string;
  options?: string[];
}

export interface Section {
  label: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
  answerKey: string[];
  message?: string;
}

export interface Assignment {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
  status: "queued" | "processing" | "done" | "failed";
  paperId?: string | null;
}

interface AssignmentStore {
  form: FormState;
  assignments: Assignment[];
  currentPaper: QuestionPaper | null;
  jobStatus: "idle" | "queued" | "processing" | "done" | "failed";
  progress: number;

  setForm: (patch: Partial<FormState>) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, patch: Partial<QuestionTypeRow>) => void;
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;
  setCurrentPaper: (paper: QuestionPaper) => void;
  setJobStatus: (status: AssignmentStore["jobStatus"]) => void;
  setProgress: (n: number) => void;
  resetForm: () => void;
}

const defaultForm: FormState = {
  title: "",
  dueDate: "",
  questionTypes: [
    { id: "1", type: "Multiple Choice Questions", numQuestions: 4, marks: 1 },
    { id: "2", type: "Short Questions", numQuestions: 3, marks: 2 },
  ],
  instructions: "",
  file: null,
};

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  form: defaultForm,
  assignments: [],
  currentPaper: null,
  jobStatus: "idle",
  progress: 0,

  setForm: (patch) =>
    set((state) => ({ form: { ...state.form, ...patch } })),

  addQuestionType: () =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: [
          ...state.form.questionTypes,
          {
            id: Date.now().toString(),
            type: "Multiple Choice Questions",
            numQuestions: 5,
            marks: 1,
          },
        ],
      },
    })),

  removeQuestionType: (id) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.filter((r) => r.id !== id),
      },
    })),

  updateQuestionType: (id, patch) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      },
    })),

  setAssignments: (assignments) => set({ assignments }),

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  deleteAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    })),

  setCurrentPaper: (paper) => set({ currentPaper: paper }),

  setJobStatus: (jobStatus) => set({ jobStatus }),

  setProgress: (progress) => set({ progress }),

  resetForm: () => set({ form: defaultForm, jobStatus: "idle", progress: 0 }),
}));
