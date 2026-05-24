import type { BloomsLevel } from "@/store/assignmentStore";

const BLOOMS_COLORS: Record<BloomsLevel, { bg: string; text: string; border: string }> = {
  Remember:   { bg: "#ffc9c9", text: "#c92a2a", border: "#fa5252" },
  Understand: { bg: "#ffd8a8", text: "#e67700", border: "#fd7e14" },
  Apply:      { bg: "#fff3bf", text: "#e67700", border: "#fcc419" },
  Analyze:    { bg: "#b2f2bb", text: "#2b8a3e", border: "#40c057" },
  Evaluate:   { bg: "#a5d8ff", text: "#1864ab", border: "#339af0" },
  Create:     { bg: "#d0bfff", text: "#5f3dc4", border: "#7950f2" },
};

interface BloomsBadgeProps {
  level: BloomsLevel;
  small?: boolean;
}

export default function BloomsBadge({ level, small = false }: BloomsBadgeProps) {
  const colors = BLOOMS_COLORS[level];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: "4px",
        fontSize: small ? "9px" : "10px",
        fontWeight: 600,
        padding: small ? "1px 4px" : "2px 6px",
        letterSpacing: "0.02em",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "inline-block",
        lineHeight: "1.4",
      }}
    >
      {level}
    </span>
  );
}
