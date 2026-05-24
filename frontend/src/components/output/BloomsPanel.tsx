"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { BloomsDistribution, BloomsLevel } from "@/store/assignmentStore";

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  Remember:   "#fa5252",
  Understand: "#fd7e14",
  Apply:      "#fcc419",
  Analyze:    "#40c057",
  Evaluate:   "#339af0",
  Create:     "#7950f2",
};

const LEVELS: BloomsLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

interface BloomsPanelProps {
  distribution: BloomsDistribution;
  onRebalance: () => void;
  isRebalancing: boolean;
}

export default function BloomsPanel({ distribution, onRebalance, isRebalancing }: BloomsPanelProps) {
  const chartData = LEVELS.map((level) => ({
    name: level,
    value: distribution[level],
    color: BLOOMS_COLORS[level],
  })).filter((d) => d.value > 0);

  const isUnbalanced = distribution.recallPercentage > 65;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "16px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#111", marginBottom: "12px" }}>
        Bloom&apos;s Taxonomy
      </h3>

      {isUnbalanced && (
        <div
          style={{
            background: "#fff9db",
            border: "1px solid #fcc419",
            borderRadius: "6px",
            padding: "8px 10px",
            marginBottom: "12px",
            fontSize: "11px",
            color: "#e67700",
            lineHeight: "1.5",
          }}
        >
          <strong>Recall-heavy paper</strong> — {distribution.recallPercentage}% Remember + Understand. Consider adding application questions.
        </div>
      )}

      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, ""]}
              contentStyle={{ fontSize: "11px", borderRadius: "6px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
        {LEVELS.map((level) => (
          <div
            key={level}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                background: BLOOMS_COLORS[level],
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: "#374151" }}>{level}</span>
            <span style={{ color: "#6b7280", fontWeight: 600 }}>{distribution[level]}%</span>
          </div>
        ))}
      </div>

      {isUnbalanced && (
        <button
          onClick={onRebalance}
          disabled={isRebalancing}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "7px",
            background: isRebalancing ? "#f3f4f6" : "#1a1a2e",
            color: isRebalancing ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isRebalancing ? "not-allowed" : "pointer",
          }}
        >
          {isRebalancing ? "Rebalancing..." : "Rebalance Paper"}
        </button>
      )}
    </div>
  );
}
