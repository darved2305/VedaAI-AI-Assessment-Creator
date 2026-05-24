"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/assignments/EmptyState";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import { useAssignmentStore } from "@/store/assignmentStore";
import { assignmentsApi } from "@/lib/api";

export default function AssignmentsPage() {
  const { assignments, setAssignments, deleteAssignment } = useAssignmentStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await assignmentsApi.list();
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
        setError("Could not load assignments. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // setAssignments is a stable Zustand setter — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    try {
      await assignmentsApi.remove(id);
      deleteAssignment(id);
    } catch {
      alert("Failed to delete assignment.");
    }
  }

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const hasAssignments = assignments.length > 0;

  return (
    <PageShell breadcrumb="Assignment" mobileShowBack={false}>
      <div className="p-6 min-h-screen">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : !hasAssignments ? (
          <EmptyState />
        ) : (
          <>
            {/* Page heading */}
            <div className="flex items-center gap-3 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: "var(--color-green)" }}
              />
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Assignments
              </h1>
            </div>
            <p
              className="mb-5 text-sm"
              style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
            >
              Manage and create assignments for your classes.
            </p>

            {/* Filter + Search row */}
            <div className="flex items-center gap-3 mb-6">
              <button
                className="flex items-center gap-1.5 text-sm px-3 py-2 flex-shrink-0 whitespace-nowrap rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Filter By</span>
              </button>

              <div className="flex-1 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-subtle)" }}
                />
                <input
                  type="text"
                  placeholder="Search Assignment"
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
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-32">
              {filtered.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  {...assignment}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Frosted gradient bottom bar — matches Figma spec */}
            <div
              className="fixed bottom-0 z-20 flex items-center justify-center"
              style={{
                left: "var(--sidebar-offset)",
                right: 0,
                height: "88px",
                background: "linear-gradient(to bottom, rgba(234,234,234,0) 0%, rgba(218,218,218,0.97) 100%)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              <Link
                href="/create"
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
                style={{
                  background: "var(--color-btn-primary)",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.30)",
                }}
              >
                <SparkleIcon />
                + Create Assignment
              </Link>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-sm text-red-500 text-center max-w-sm">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-sm font-medium rounded-lg"
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
