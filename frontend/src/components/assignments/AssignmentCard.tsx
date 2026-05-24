"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

interface AssignmentCardProps {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
  onDelete: (id: string) => void;
}

export default function AssignmentCard({
  id,
  title,
  assignedOn,
  dueDate,
  onDelete,
}: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className="relative p-5 flex flex-col gap-4"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-semibold text-base leading-snug"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>

        {/* Three-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-9 z-30 py-1.5 min-w-[156px]"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-dropdown)",
              }}
            >
              <button
                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{ color: "var(--color-text-primary)" }}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/output/${id}`);
                }}
              >
                View Assignment
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors"
                style={{ color: "var(--color-red)" }}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date row */}
      <div className="flex items-center gap-4 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Assigned on
          </span>
          {" : "}
          <span style={{ color: "var(--color-text-secondary)" }}>{assignedOn}</span>
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            Due
          </span>
          {" : "}
          <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>{dueDate}</span>
        </span>
      </div>
    </div>
  );
}
