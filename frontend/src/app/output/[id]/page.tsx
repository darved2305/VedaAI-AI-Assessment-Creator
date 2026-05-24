"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, RefreshCw, ArrowLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import QuestionPaper from "@/components/output/QuestionPaper";
import { useAssignmentStore } from "@/store/assignmentStore";
import { assignmentsApi, type ApiPaper } from "@/lib/api";

type JobStatus = "queued" | "processing" | "done" | "failed";

export default function OutputPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setJobStatus } = useAssignmentStore();

  const [paper, setPaper] = useState<ApiPaper | null>(null);
  const [status, setStatus] = useState<JobStatus>("processing");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { assignment, paper: p } = await assignmentsApi.get(id);
      setStatus(assignment.status);
      setJobStatus(assignment.status);

      if (p) {
        setPaper(p);
      } else if (assignment.status === "done" && assignment.paperId) {
        const fullPaper = await assignmentsApi.getPaper(id);
        setPaper(fullPaper);
      }
    } catch {
      setError("Failed to load the assignment. Please try again.");
    }
  // setJobStatus is a stable Zustand setter — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Poll every 3s while the job is still in progress */
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

  /* Also hook into WebSocket for instant notification */
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "job_update" && msg.assignmentId === id) {
            setStatus(msg.status);
            setJobStatus(msg.status);
            if (msg.status === "done") loadData();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // websocket unavailable — polling will handle updates
    }

    return () => ws?.close();
  // setJobStatus is a stable Zustand setter — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadData]);

  return (
    <PageShell breadcrumb="Create New" mobileShowBack mobileTitle="">
      <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
        {/* Action bar */}
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
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10 self-start"
                style={{ border: "1px solid rgba(255,255,255,0.35)", borderRadius: "6px", color: "#FFFFFF" }}
              >
                <Download size={13} />
                Download as PDF
              </button>
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
            <QuestionPaper paper={{
              id: paper._id,
              assignmentId: paper.assignmentId,
              schoolName: paper.schoolName,
              subject: paper.subject,
              className: paper.className,
              timeAllowed: paper.timeAllowed,
              maxMarks: paper.maxMarks,
              sections: paper.sections,
              answerKey: paper.answerKey,
              message: paper.message,
            }} />
          )}
        </div>
      </div>
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
