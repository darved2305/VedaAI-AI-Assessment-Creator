export const REDIS_KEYS = {
  assignmentsAll: "assignments:all",
  questionVersions: (assignmentId: string, questionId: string) =>
    `qv:${assignmentId}:${questionId}`,
  variantJob: (jobId: string) => `vj:${jobId}`,
} as const;
