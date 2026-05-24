"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, RefreshCw, ArrowLeft, Layers } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import QuestionPaper from "@/components/output/QuestionPaper";
import BloomsPanel from "@/components/output/BloomsPanel";
import VariantModal from "@/components/output/VariantModal";
import VariantGrid from "@/components/output/VariantGrid";
import { useAssignmentStore } from "@/store/assignmentStore";
import { assignmentsApi, variantsApi, type ApiPaper } from "@/lib/api";
import type { Question, QuestionVersion } from "@/store/assignmentStore";

type JobStatus = "queued" | "processing" | "done" | "failed";

export default function OutputPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    setJobStatus,
    setBloomsDistribution,
    bloomsDistribution,
    questionVersions,
    setQuestionVersions,
    pushQuestionVersion,
    refiningQuestions,
    setRefining,
    updateQuestionInPaper,
    variants,
    setVariants,
    variantJobId,
    setVariantJobId,
    variantProgress,
    setVariantProgress,
    updatePaperSections,
  } = useAssignmentStore();

  const [paper, setPaper] = useState<ApiPaper | null>(null);
  const [status, setStatus] = useState<JobStatus>("processing");
  const [error, setError] = useState<string | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [streamBuffers, setStreamBuffers] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { assignment, paper: p } = await assignmentsApi.get(id);
      setStatus(assignment.status);
      setJobStatus(assignment.status);

      if (p) {
        setPaper(p);
        if (p.bloomsDistribution) setBloomsDistribution(p.bloomsDistribution);
      } else if (assignment.status === "done" && assignment.paperId) {
        const fullPaper = await assignmentsApi.getPaper(id);
        setPaper(fullPaper);
        if (fullPaper.bloomsDistribution) setBloomsDistribution(fullPaper.bloomsDistribution);
      }
    } catch {
      setError("Failed to load the assignment. Please try again.");
    }
  }, [id, setJobStatus, setBloomsDistribution]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (status === "done" || status === "failed") {
        clearInterval(interval);
        return;
      }
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [status, loadData]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; assignmentId?: string; [key: string]: unknown };

          if (msg.type === "job_update" && msg.assignmentId === id) {
            setStatus(msg.status as JobStatus);
            setJobStatus(msg.status as JobStatus);
            if (msg.status === "done") loadData();
          }

          if (msg.assignmentId !== id) return;

          if (msg.type === "BLOOMS_CLASSIFIED") {
            setBloomsDistribution(msg.distribution as typeof bloomsDistribution extends null ? never : NonNullable<typeof bloomsDistribution>);
          }

          if (msg.type === "QUESTION_REFINE_START") {
            const qId = msg.questionId as string;
            setRefining(qId, true);
            setStreamBuffers((prev) => ({ ...prev, [qId]: "" }));
          }

          if (msg.type === "QUESTION_REFINE_TOKEN") {
            const qId = msg.questionId as string;
            const token = msg.token as string;
            setStreamBuffers((prev) => ({ ...prev, [qId]: (prev[qId] ?? "") + token }));
          }

          if (msg.type === "QUESTION_REFINE_DONE") {
            const qId = msg.questionId as string;
            const updated = msg.question as Question;
            const version = msg.version as number;
            setRefining(qId, false);
            setStreamBuffers((prev) => ({ ...prev, [qId]: "" }));
            updateQuestionInPaper(updated.number, updated);
            pushQuestionVersion(qId, {
              version,
              question: updated,
              instruction: "",
              createdAt: new Date().toISOString(),
            });
          }

          if (msg.type === "QUESTION_REFINE_ERROR") {
            const qId = msg.questionId as string;
            setRefining(qId, false);
            setStreamBuffers((prev) => ({ ...prev, [qId]: "" }));
          }

          if (msg.type === "VARIANT_PROGRESS") {
            setVariantProgress({ completed: msg.completed as number, total: msg.total as number });
          }

          if (msg.type === "VARIANT_DONE") {
            setVariants(msg.variants as typeof variants);
            setVariantJobId(null);
            setVariantProgress(null);
            setShowVariantModal(false);
          }

          if (msg.type === "VARIANT_ERROR") {
            setVariantJobId(null);
            setVariantProgress(null);
          }

          if (msg.type === "BLOOMS_REBALANCE_DONE") {
            setIsRebalancing(false);
            updatePaperSections(msg.updatedSections as Parameters<typeof updatePaperSections>[0]);
            setBloomsDistribution(msg.distribution as NonNullable<typeof bloomsDistribution>);
          }

          if (msg.type === "BLOOMS_REBALANCE_ERROR") {
            setIsRebalancing(false);
          }
        } catch {
          // ignore malformed messages
        }
      };
    } catch {
      // websocket unavailable — polling will handle updates
    }

    return () => ws?.close();
  }, [id, loadData, setJobStatus, setBloomsDistribution, setRefining, updateQuestionInPaper, pushQuestionVersion, setVariants, setVariantJobId, setVariantProgress, updatePaperSections, bloomsDistribution, variants]);

  const handleRefine = useCallback(
    async (questionId: string, question: Question, instruction: string, sectionContext: string) => {
      try {
        await assignmentsApi.refineQuestion(id, {
          questionId,
          originalQuestion: {
            text: question.text,
            difficulty: question.difficulty,
            marks: question.marks,
            type: question.type,
            number: question.number,
            options: question.options,
          },
          instruction,
          sectionContext,
        });
      } catch (err) {
        console.error("Refine request failed:", err);
      }
    },
    [id]
  );

  const handleRevert = useCallback(
    (questionId: string, version: QuestionVersion) => {
      updateQuestionInPaper(version.question.number, version.question);
      setQuestionVersions(
        questionId,
        (questionVersions[questionId] ?? []).filter((v) => v.version <= version.version)
      );
    },
    [updateQuestionInPaper, setQuestionVersions, questionVersions]
  );

  const handleGenerateVariants = useCallback(
    async (config: {
      count: number;
      shuffleQuestions: boolean;
      shuffleMCQOptions: boolean;
      mutateNumericals: boolean;
      addQRWatermark: boolean;
    }) => {
      try {
        const { jobId } = await variantsApi.generate(id, config);
        setVariantJobId(jobId);
      } catch (err) {
        console.error("Variant generation failed:", err);
      }
    },
    [id, setVariantJobId]
  );

  const handleRebalance = useCallback(async () => {
    setIsRebalancing(true);
    try {
      await assignmentsApi.rebalance(id);
    } catch {
      setIsRebalancing(false);
    }
  }, [id]);

  const currentPaperFromStore = useAssignmentStore((s) => s.currentPaper);
  const displayPaper = currentPaperFromStore
    ? {
        ...paper,
        sections: currentPaperFromStore.sections,
      }
    : paper;

  return (
    <PageShell breadcrumb="Create New" mobileShowBack mobileTitle="">
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        <div
          className="action-bar px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-4"
          style={{ background: "var(--color-dark-header)" }}
        >
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-dark-header-text)" }}>
              {paper?.message
                ? paper.message
                : status === "failed"
                ? "Question paper generation failed."
                : "Generating your question paper with AI. Please wait..."}
            </p>
            {paper && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 self-start"
                  style={{ border: "1px solid rgba(255,255,255,0.35)", borderRadius: "6px", color: "#FFFFFF" }}
                >
                  <Download size={13} />
                  Download as PDF
                </button>
                <button
                  onClick={() => setShowVariantModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 self-start"
                  style={{ border: "1px solid rgba(255,255,255,0.35)", borderRadius: "6px", color: "#FFFFFF" }}
                >
                  <Layers size={13} />
                  Generate Variants
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {paper && (
              <button
                onClick={() => { setStatus("processing"); setPaper(null); loadData(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", color: "#FFFFFF" }}
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-8 sm:pb-12">
          {error ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => router.push("/assignments")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full"
                style={{ background: "var(--color-btn-primary)", color: "#fff" }}
              >
                <ArrowLeft size={14} /> Back to Assignments
              </button>
            </div>
          ) : !paper ? (
            <GeneratingState status={status} />
          ) : (
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {variants.length > 0 && (
                  <div className="mb-6">
                    <VariantGrid variants={variants} />
                  </div>
                )}
                <QuestionPaper
                  paper={{
                    id: paper._id,
                    assignmentId: paper.assignmentId,
                    schoolName: paper.schoolName,
                    subject: paper.subject,
                    className: paper.className,
                    timeAllowed: paper.timeAllowed,
                    maxMarks: paper.maxMarks,
                    sections: (displayPaper?.sections ?? paper.sections) as typeof paper.sections,
                    answerKey: paper.answerKey,
                    bloomsDistribution: paper.bloomsDistribution,
                    message: paper.message,
                  }}
                  assignmentId={id}
                  questionVersions={questionVersions}
                  refiningQuestions={refiningQuestions}
                  streamBuffers={streamBuffers}
                  onRefine={handleRefine}
                  onRevert={handleRevert}
                />
              </div>

              {bloomsDistribution && (
                <div style={{ width: "220px", flexShrink: 0, position: "sticky", top: "24px" }}>
                  <BloomsPanel
                    distribution={bloomsDistribution}
                    onRebalance={handleRebalance}
                    isRebalancing={isRebalancing}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showVariantModal && (
        <VariantModal
          onClose={() => setShowVariantModal(false)}
          onGenerate={handleGenerateVariants}
          isGenerating={!!variantJobId}
          progress={variantProgress}
        />
      )}
    </PageShell>
  );
}

function GeneratingState({ status }: { status: JobStatus }) {
  const label =
    status === "failed"
      ? "Generation failed"
      : status === "queued"
      ? "Queued for generation..."
      : "Generating question paper with AI...";

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      {status !== "failed" && (
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
        </div>
      )}
      {status === "failed" && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-red-light)" }}
        >
          <span className="text-2xl">✕</span>
        </div>
      )}
      <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-xs text-center max-w-xs" style={{ color: "var(--color-text-subtle)" }}>
        {status !== "failed"
          ? "This usually takes 10–20 seconds. The page will update automatically."
          : "Please go back and try creating the assignment again."}
      </p>
    </div>
  );
}
