"use client";

import { X, Minus, Plus } from "lucide-react";
import type { QuestionTypeRow as RowType } from "@/store/assignmentStore";

const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph Based Questions",
  "Numerical Problems",
  "Long Questions",
  "True/False Questions",
  "Essay Questions",
];

interface QuestionTypeRowProps {
  row: RowType;
  onRemove: () => void;
  onChange: (patch: Partial<RowType>) => void;
}

export default function QuestionTypeRow({ row, onRemove, onChange }: QuestionTypeRowProps) {
  function clamp(val: number, min = 1, max = 50) {
    return Math.max(min, Math.min(max, val));
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-1 w-full">
        <div className="flex-1">
          <select
            value={row.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full text-sm py-2 px-3 appearance-none"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              height: "38px",
            }}
          >
            {questionTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Stepper
          value={row.numQuestions}
          onChange={(v) => onChange({ numQuestions: clamp(v) })}
        />
        <Stepper
          value={row.marks}
          onChange={(v) => onChange({ marks: clamp(v) })}
        />
      </div>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="flex items-center"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        height: "38px",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-9 h-full flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
        style={{ color: "var(--color-text-muted)", borderRight: "1px solid var(--color-border)" }}
      >
        <Minus size={13} />
      </button>
      <span
        className="w-8 text-center text-sm font-medium flex-shrink-0"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-full flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
        style={{ color: "var(--color-text-muted)", borderLeft: "1px solid var(--color-border)" }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
