"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  FileText,
  Sparkles,
  BookOpen,
  Settings,
} from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

const navItems = [
  { icon: LayoutGrid, label: "Home", href: "/home" },
  { icon: Users, label: "My Groups", href: "/groups" },
  { icon: FileText, label: "Assignments", href: "/assignments" },
  { icon: Sparkles, label: "AI Teacher's Toolkit", href: "/toolkit" },
  { icon: BookOpen, label: "My Library", href: "/library" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const assignmentCount = useAssignmentStore((s) => s.assignments.length);

  return (
    <aside
      className="fixed z-40 hidden lg:flex flex-col"
      style={{
        width: "var(--sidebar-width)",
        top: "12px",
        left: "12px",
        bottom: "12px",
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow:
          "0 32px 48px rgba(0,0,0,0.20), 0 16px 48px rgba(0,0,0,0.12)",
        padding: "24px",
      }}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
            style={{ background: "#E8521A" }}
          >
            <Image
              src="/vedaai-logo.jpg"
              alt="VedaAI"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            VedaAI
          </span>
        </div>

        {/* Create Assignment CTA */}
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full py-2.5 font-semibold text-sm mb-6 transition-opacity hover:opacity-90"
          style={{
            background: "var(--color-btn-primary)",
            color: "#FFFFFF",
            borderRadius: "9999px",
            border: "2px solid var(--color-accent)",
          }}
        >
          <SparkleIcon />
          <span>+ Create Assignment</span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href ||
              (href === "/assignments" &&
                (pathname.startsWith("/assignments") ||
                  pathname.startsWith("/create") ||
                  pathname.startsWith("/output")));
            const badge =
              href === "/assignments" && assignmentCount > 0
                ? assignmentCount
                : null;

            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg"
                style={{
                  background: isActive
                    ? "var(--color-nav-active-bg)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 leading-none"
                    style={{
                      background: "var(--color-badge-orange)",
                      color: "#fff",
                      borderRadius: "9999px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 rounded-lg mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Settings size={16} strokeWidth={1.75} />
          <span>Settings</span>
        </Link>

        {/* School profile card */}
        <div
          className="flex items-center gap-2.5 p-3 rounded-xl"
          style={{ border: "1px solid var(--color-border-light)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "#E8D5B7" }}
          >
            <SchoolAvatar />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              Delhi Public School
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
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

function SchoolAvatar() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="10" width="18" height="11" rx="1" fill="#A0785A" />
      <path d="M11 2L2 8h18L11 2Z" fill="#8B6548" />
      <rect x="9" y="14" width="4" height="7" fill="#E8D5B7" />
      <rect x="4" y="12" width="3" height="3" rx="0.5" fill="#E8D5B7" />
      <rect x="15" y="12" width="3" height="3" rx="0.5" fill="#E8D5B7" />
      <rect x="10.25" y="2" width="1.5" height="3" fill="#A0785A" />
    </svg>
  );
}
