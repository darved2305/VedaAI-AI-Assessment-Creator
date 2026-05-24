"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { assignmentsApi, type ApiAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";

function parseDDMMYYYY(s: string): Date | null {
  const p = s.split("-");
  if (p.length !== 3) return null;
  const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  return isNaN(d.getTime()) ? null : d;
}

export default function HomePage() {
  const { setAssignments } = useAssignmentStore();
  const [assignments, setLocal] = useState<ApiAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("Could not load dashboard data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [setAssignments]);

  useEffect(() => {
    load();
  }, [load]);

  /* Live updates via WebSocket — refresh stats when a job completes */
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (
            msg.type === "job_update" &&
            (msg.status === "done" || msg.status === "failed")
          ) {
            load();
          }
        } catch {
          /* ignore parse errors */
        }
      };
    } catch {
      /* WebSocket unavailable — polling on assignments page handles updates */
    }
    return () => {
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, [load]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "done").length;
  const pending = assignments.filter(
    (a) => a.status === "queued" || a.status === "processing"
  ).length;

  const recent = assignments.slice(0, 4);

  const upcoming = assignments
    .filter((a) => {
      const d = parseDDMMYYYY(a.dueDate);
      return d && d >= today && a.status !== "failed";
    })
    .sort((a, b) => {
      const da = parseDDMMYYYY(a.dueDate)!.getTime();
      const db = parseDDMMYYYY(b.dueDate)!.getTime();
      return da - db;
    })
    .slice(0, 3);

  return (
    <PageShell breadcrumb="Home" mobileShowBack={false}>
      <div className="p-6 min-h-screen">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--color-green)" }}
          />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Dashboard
          </h1>
        </div>
        <p
          className="mb-8 text-sm"
          style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
        >
          Your teaching overview at a glance.
        </p>

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <StatCard
                label="Total"
                value={total}
                icon={FileText}
                color="#E8521A"
                colorLight="#FEF3EE"
              />
              <StatCard
                label="Generated"
                value={completed}
                icon={CheckCircle2}
                color="#16A34A"
                colorLight="#F0FDF4"
              />
              <StatCard
                label="Pending"
                value={pending}
                icon={Clock}
                color="#0891B2"
                colorLight="#ECFEFF"
              />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href="/create"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-85"
                style={{ background: "var(--color-btn-primary)", color: "#fff" }}
              >
                <SparkleIcon />
                + Create Assignment
              </Link>
              <Link
                href="/assignments"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-colors hover:bg-gray-100"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                View All
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/toolkit"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-colors hover:bg-gray-100"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                AI Toolkit
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Upcoming deadlines */}
            {upcoming.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock
                    size={14}
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Upcoming Deadlines
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {upcoming.map((a) => (
                    <DeadlineItem key={a._id} assignment={a} today={today} />
                  ))}
                </div>
              </section>
            )}

            {/* Recent assignments */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Recent Assignments
                </h2>
                {total > 4 && (
                  <Link
                    href="/assignments"
                    className="text-xs font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    View all →
                  </Link>
                )}
              </div>

              {total === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-2 pb-10">
                  {recent.map((a) => (
                    <RecentItem key={a._id} assignment={a} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  colorLight,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  colorLight: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: colorLight }}
      >
        <Icon size={17} style={{ color }} strokeWidth={1.75} />
      </div>
      <div>
        <p
          className="text-2xl font-bold leading-none mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function RecentItem({ assignment }: { assignment: ApiAssignment }) {
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    queued: { label: "Queued", bg: "#F3F4F6", text: "#6B7280" },
    processing: { label: "Generating", bg: "#EFF6FF", text: "#2563EB" },
    done: { label: "Done", bg: "#F0FDF4", text: "#16A34A" },
    failed: { label: "Failed", bg: "#FEF2F2", text: "#DC2626" },
  };
  const cfg = statusConfig[assignment.status] ?? statusConfig.queued;

  return (
    <Link
      href={`/output/${assignment._id}`}
      className="flex items-center gap-3 p-3.5 rounded-xl transition-colors hover:bg-gray-50"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#FEF3EE" }}
      >
        <FileText size={16} style={{ color: "#E8521A" }} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {assignment.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Due: {assignment.dueDate}
        </p>
      </div>
      <span
        className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.text }}
      >
        {cfg.label}
      </span>
    </Link>
  );
}

function DeadlineItem({
  assignment,
  today,
}: {
  assignment: ApiAssignment;
  today: Date;
}) {
  const dueDate = parseDDMMYYYY(assignment.dueDate);
  const daysLeft = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const badge =
    daysLeft === null
      ? { bg: "#F3F4F6", text: "#6B7280", label: assignment.dueDate }
      : daysLeft === 0
      ? { bg: "#FEF2F2", text: "#DC2626", label: "Due today" }
      : daysLeft === 1
      ? { bg: "#FFF7ED", text: "#EA580C", label: "Due tomorrow" }
      : daysLeft <= 3
      ? { bg: "#FFF7ED", text: "#EA580C", label: `${daysLeft}d left` }
      : { bg: "#F0FDF4", text: "#16A34A", label: `${daysLeft}d left` };

  return (
    <Link
      href={`/output/${assignment._id}`}
      className="flex items-center gap-3 p-3.5 rounded-xl transition-colors hover:bg-gray-50"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {assignment.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Due: {assignment.dueDate}
        </p>
      </div>
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: badge.bg, color: badge.text }}
      >
        {badge.label}
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl"
      style={{ border: "1.5px dashed var(--color-border)" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--color-nav-active-bg)" }}
      >
        <FileText size={24} style={{ color: "var(--color-text-muted)" }} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
          No assignments yet
        </p>
        <p
          className="text-xs max-w-xs"
          style={{ color: "var(--color-text-subtle)" }}
        >
          Create your first AI-generated question paper to get started.
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

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl animate-pulse"
            style={{ background: "var(--color-border-light)" }}
          />
        ))}
      </div>
      {/* Rows skeleton */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "var(--color-border-light)" }}
          />
        ))}
      </div>
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
      <p className="text-sm text-center max-w-xs" style={{ color: "var(--color-text-muted)" }}>
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
