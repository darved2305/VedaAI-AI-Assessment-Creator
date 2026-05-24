"use client";

import Link from "next/link";
import { Bell, Menu, ArrowLeft } from "lucide-react";

interface MobileTopBarProps {
  showBack?: boolean;
  title?: string;
}

export default function MobileTopBar({ showBack = false, title }: MobileTopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-4 lg:hidden"
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border-light)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Link href="/assignments" className="flex items-center gap-2">
            <div
              className="w-7 h-7 flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--color-accent)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3 4L9 14L15 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 4L9 9L12 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              </svg>
            </div>
            <span className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
              VedaAI
            </span>
          </Link>
        )}
        {title && (
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell size={19} style={{ color: "var(--color-text-secondary)" }} />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: "var(--color-badge-orange)" }}
          />
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: "#C4A882" }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="2.8" fill="#8B6347" />
            <path d="M2 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#8B6347" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        <button style={{ color: "var(--color-text-secondary)" }}>
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
