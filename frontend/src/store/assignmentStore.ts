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

export interface Question {
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
  question: Question;
  instruction: string;
  createdAt: string;
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
  bloomsDistribution?: BloomsDistribution;
  message?: string;
}

export interface PaperVariant {
  variantId: string;
  label: string;
  assignmentId: string;
  sections: Section[];
  qrPayload: string | null;
  createdAt: string;
  zipBase64?: string;
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
  questionVersions: Record<string, QuestionVersion[]>;
  bloomsDistribution: BloomsDistribution | null;
  variants: PaperVariant[];
  refiningQuestions: Set<string>;
  variantJobId: string | null;
  variantProgress: { completed: number; total: number } | null;

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
  setQuestionVersions: (questionId: string, versions: QuestionVersion[]) => void;
  pushQuestionVersion: (questionId: string, version: QuestionVersion) => void;
  setBloomsDistribution: (dist: BloomsDistribution) => void;
  updateQuestionInPaper: (questionNumber: number, updated: Question) => void;
  setVariants: (variants: PaperVariant[]) => void;
  setRefining: (questionId: string, isRefining: boolean) => void;
  setVariantJobId: (jobId: string | null) => void;
  setVariantProgress: (progress: { completed: number; total: number } | null) => void;
  updatePaperSections: (sections: Section[]) => void;
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
  questionVersions: {},
  bloomsDistribution: null,
  variants: [],
  refiningQuestions: new Set(),
  variantJobId: null,
  variantProgress: null,

  setForm: (patch) =>
    set((state) => ({ form: { ...state.form, ...patch } })),

  addQuestionType: () =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: [
          ...state.form.questionTypes,
          { id: Date.now().toString(), type: "Multiple Choice Questions", numQuestions: 5, marks: 1 },
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
    set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),

  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
  setProgress: (progress) => set({ progress }),
  resetForm: () => set({ form: defaultForm, jobStatus: "idle", progress: 0 }),

  setQuestionVersions: (questionId, versions) =>
    set((state) => ({
      questionVersions: { ...state.questionVersions, [questionId]: versions },
    })),

  pushQuestionVersion: (questionId, version) =>
    set((state) => {
      const existing = state.questionVersions[questionId] ?? [];
      return {
        questionVersions: { ...state.questionVersions, [questionId]: [...existing, version] },
      };
    }),

  setBloomsDistribution: (dist) => set({ bloomsDistribution: dist }),

  updateQuestionInPaper: (questionNumber, updated) =>
    set((state) => {
      if (!state.currentPaper) return state;
      const sections = state.currentPaper.sections.map((section) => ({
        ...section,
        questions: section.questions.map((q) =>
          q.number === questionNumber ? { ...q, ...updated } : q
        ),
      }));
      return { currentPaper: { ...state.currentPaper, sections } };
    }),

  setVariants: (variants) => set({ variants }),

  setRefining: (questionId, isRefining) =>
    set((state) => {
      const next = new Set(state.refiningQuestions);
      if (isRefining) next.add(questionId);
      else next.delete(questionId);
      return { refiningQuestions: next };
    }),

  setVariantJobId: (variantJobId) => set({ variantJobId }),
  setVariantProgress: (variantProgress) => set({ variantProgress }),

  updatePaperSections: (sections) =>
    set((state) => {
      if (!state.currentPaper) return state;
      return { currentPaper: { ...state.currentPaper, sections } };
    }),
}));
