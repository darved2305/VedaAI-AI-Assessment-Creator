"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { assignmentsApi, type ApiAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";

export default function LibraryPage() {
  const { setAssignments } = useAssignmentStore();
  const [assignments, setLocal] = useState<ApiAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await assignmentsApi.list();
      setLocal(data);
      setAssignments(
        data.map((a) => ({
          id: a._id,
          title: a.title,
          assignedOn: a.assignedOn,
          dueDate: a.dueDate,
          status: a.status,
          paperId: a.paperId,
        }))
      );
    } catch {
      setError("Could not load library. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [setAssignments]);

  useEffect(() => {
    load();
  }, [load]);

  /* Live update when a generation completes */
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "job_update" && msg.status === "done") {
            load();
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* WebSocket unavailable */
    }
    return () => {
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, [load]);

  const papers = assignments.filter((a) => a.status === "done");

  const filtered = papers.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell breadcrumb="My Library" mobileShowBack={false}>
      <div className="p-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--color-green)" }}
          />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            My Library
          </h1>
        </div>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
        >
          All your generated question papers and saved resources.
        </p>

        {loading ? (
          <LibrarySkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : papers.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-subtle)" }}
              />
              <input
                type="text"
                placeholder="Search question papers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16"
                style={{ color: "var(--color-text-subtle)" }}
              >
                <p className="text-sm">No papers match &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
                {filtered.map((a) => (
                  <PaperCard key={a._id} assignment={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function PaperCard({ assignment }: { assignment: ApiAssignment }) {
  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-xl"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#FEF3EE" }}
        >
          <FileText size={18} style={{ color: "#E8521A" }} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {assignment.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              Question Paper
            </span>
          </div>
        </div>
      </div>

      {/* Date info */}
      <div className="flex items-center gap-4 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Generated
          </span>
          {" : "}
          <span>{assignment.assignedOn}</span>
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Due
          </span>
          {" : "}
          <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>
            {assignment.dueDate}
          </span>
        </span>
      </div>

      {/* Action */}
      <Link
        href={`/output/${assignment._id}`}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full self-start transition-opacity hover:opacity-85"
        style={{ background: "var(--color-btn-primary)", color: "#fff" }}
      >
        <ExternalLink size={11} />
        View Paper
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl"
      style={{ border: "1.5px dashed var(--color-border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--color-nav-active-bg)" }}
      >
        <BookOpen size={28} style={{ color: "var(--color-text-muted)" }} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your library is empty
        </p>
        <p
          className="text-xs max-w-xs"
          style={{ color: "var(--color-text-subtle)" }}
        >
          Generated question papers will appear here once you create and generate
          assignments.
        </p>
      </div>
      <Link
        href="/create"
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-85"
        style={{ background: "var(--color-btn-primary)", color: "#fff" }}
      >
        <SparkleIcon />
        Create Assignment
      </Link>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 rounded-xl animate-pulse"
          style={{ background: "var(--color-border-light)" }}
        />
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <AlertCircle size={32} style={{ color: "var(--color-text-subtle)" }} strokeWidth={1.5} />
      <p
        className="text-sm text-center max-w-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-85"
        style={{ background: "var(--color-btn-primary)", color: "#fff" }}
      >
        Retry
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1L8.2 5.8L13 7L8.2 8.2L7 13L5.8 8.2L1 7L5.8 5.8L7 1Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
