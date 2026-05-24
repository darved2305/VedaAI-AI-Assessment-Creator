"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, Bell, ChevronDown } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

interface TopBarProps {
  breadcrumb?: string;
}

export default function TopBar({ breadcrumb = "Assignment" }: TopBarProps) {
  const router = useRouter();
  const pendingCount = useAssignmentStore((s) =>
    s.assignments.filter(
      (a) => a.status === "queued" || a.status === "processing"
    ).length
  );

  const teacherName =
    process.env.NEXT_PUBLIC_TEACHER_NAME?.trim() || "Teacher";

  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border-light)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-gray-100"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <LayoutGrid size={14} style={{ color: "var(--color-text-subtle)" }} />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {breadcrumb}
        </span>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-4">
        {/* Notification bell — badge only when there are active jobs */}
        <div className="relative flex items-center justify-center">
          <Bell size={18} style={{ color: "var(--color-text-secondary)" }} />
          {pendingCount > 0 && (
            <span
              className="absolute rounded-full flex items-center justify-center text-white"
              style={{
                width: "15px",
                height: "15px",
                background: "var(--color-badge-orange)",
                top: "-6px",
                right: "-7px",
                fontSize: "9px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {pendingCount}
            </span>
          )}
        </div>

        {/* User */}
        <button className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: "#C4A882" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="2.8" fill="#7A5030" />
              <path
                d="M2 15c0-3.314 2.686-6 6-6s6 2.686 6 6"
                stroke="#7A5030"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {teacherName}
          </span>
          <ChevronDown size={13} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>
    </header>
  );
}
