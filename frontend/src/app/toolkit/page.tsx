"use client";

import Link from "next/link";
import { Sparkles, FileText, Brain, PenLine, BarChart3 } from "lucide-react";
import PageShell from "@/components/layout/PageShell";

const tools = [
  {
    icon: FileText,
    label: "Create Assignment",
    description:
      "Generate curriculum-aligned CBSE question papers from any PDF, image or set of instructions — in under 30 seconds.",
    href: "/create",
    cta: "Create Now",
    accent: "#E8521A",
    accentLight: "#FEF3EE",
    disabled: false,
  },
  {
    icon: Brain,
    label: "Lesson Planner",
    description:
      "Build structured, NCERT-aligned lesson plans for any topic, grade and duration in seconds.",
    href: "#",
    cta: "Coming Soon",
    accent: "#7C3AED",
    accentLight: "#F5F3FF",
    disabled: true,
  },
  {
    icon: PenLine,
    label: "Auto Grader",
    description:
      "Upload student answer sheets and get instant AI-assisted grading with personalised feedback.",
    href: "#",
    cta: "Coming Soon",
    accent: "#0891B2",
    accentLight: "#ECFEFF",
    disabled: true,
  },
  {
    icon: BarChart3,
    label: "Progress Tracker",
    description:
      "Track student performance over time, spot learning gaps, and surface actionable insights.",
    href: "#",
    cta: "Coming Soon",
    accent: "#16A34A",
    accentLight: "#F0FDF4",
    disabled: true,
  },
];

export default function ToolkitPage() {
  return (
    <PageShell breadcrumb="AI Teacher's Toolkit" mobileShowBack={false}>
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
            AI Teacher&apos;s Toolkit
          </h1>
        </div>
        <p
          className="mb-8 text-sm"
          style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
        >
          AI-powered tools to help you teach smarter and save time.
        </p>

        {/* Hero banner */}
        <div
          className="flex items-center gap-4 p-5 mb-8 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #2D1810 100%)",
            border: "1px solid rgba(232,82,26,0.3)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(232,82,26,0.18)",
              border: "1px solid rgba(232,82,26,0.4)",
            }}
          >
            <Sparkles size={22} style={{ color: "#E8521A" }} />
          </div>
          <div>
            <p className="font-semibold text-sm text-white mb-0.5">
              Powered by advanced AI
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Generate curriculum-aligned CBSE papers from any document in under 30
              seconds.
            </p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
          {tools.map(
            ({ icon: Icon, label, description, href, cta, accent, accentLight, disabled }) => (
              <ToolCard
                key={label}
                icon={Icon}
                label={label}
                description={description}
                href={href}
                cta={cta}
                accent={accent}
                accentLight={accentLight}
                disabled={disabled}
              />
            )
          )}
        </div>
      </div>
    </PageShell>
  );
}

interface ToolCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  cta: string;
  accent: string;
  accentLight: string;
  disabled: boolean;
}

function ToolCard({
  icon: Icon,
  label,
  description,
  href,
  cta,
  accent,
  accentLight,
  disabled,
}: ToolCardProps) {
  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${disabled ? "var(--color-border)" : "var(--color-border)"}`,
        boxShadow: "var(--shadow-card)",
        opacity: disabled ? 0.72 : 1,
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Icon + text */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentLight }}
        >
          <Icon size={18} style={{ color: accent }} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--color-text-primary)" }}
            >
              {label}
            </p>
            {disabled && (
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--color-border-light)",
                  color: "var(--color-text-subtle)",
                  fontSize: "10px",
                }}
              >
                Soon
              </span>
            )}
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* CTA */}
      {disabled ? (
        <span
          className="text-xs font-medium px-3 py-1.5 rounded-full self-start"
          style={{
            background: "var(--color-border-light)",
            color: "var(--color-text-subtle)",
            border: "1px solid var(--color-border)",
          }}
        >
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full self-start transition-opacity hover:opacity-85"
          style={{ background: accent, color: "#fff" }}
        >
          <Sparkles size={11} />
          {cta}
        </Link>
      )}
    </div>
  );
}
