"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Send } from "lucide-react";
import type { Question, QuestionVersion } from "@/store/assignmentStore";

interface RefinePanelProps {
  question: Question;
  assignmentId: string;
  questionId: string;
  versions: QuestionVersion[];
  isRefining: boolean;
  streamBuffer: string;
  onRefine: (instruction: string) => void;
  onRevert: (version: QuestionVersion) => void;
}

export default function RefinePanel({
  question,
  assignmentId: _assignmentId,
  questionId: _questionId,
  versions,
  isRefining,
  streamBuffer,
  onRefine,
  onRevert,
}: RefinePanelProps) {
  const [instruction, setInstruction] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = () => {
    const trimmed = instruction.trim();
    if (!trimmed || isRefining) return;
    onRefine(trimmed);
    setInstruction("");
  };

  const suggestions = [
    "Make this harder",
    "Convert to MCQ",
    "Reduce marks to 1",
    "Add a diagram requirement",
  ];

  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderTop: "none",
        borderRadius: "0 0 8px 8px",
        padding: "10px 14px 12px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {streamBuffer && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            padding: "8px 10px",
            marginBottom: "8px",
            fontSize: "12px",
            color: "#1e40af",
            lineHeight: "1.5",
            fontFamily: "'Times New Roman', serif",
          }}
        >
          <span style={{ fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Rewriting: </span>
          {streamBuffer}
          <span style={{ opacity: 0.5, animation: "blink 1s step-end infinite" }}>▋</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setInstruction(s)}
            style={{
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "999px",
              fontSize: "10px",
              color: "#374151",
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. make this harder, convert to MCQ..."
          disabled={isRefining}
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
            outline: "none",
            background: isRefining ? "#f3f4f6" : "#fff",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isRefining || !instruction.trim()}
          style={{
            background: isRefining || !instruction.trim() ? "#f3f4f6" : "#1a1a2e",
            color: isRefining || !instruction.trim() ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            cursor: isRefining || !instruction.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Send size={13} />
        </button>
      </div>

      {versions.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <button
            onClick={() => setShowHistory((h) => !h)}
            style={{
              background: "none",
              border: "none",
              fontSize: "11px",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: 0,
            }}
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {versions.length} version{versions.length !== 1 ? "s" : ""}
          </button>

          {showHistory && (
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                maxHeight: "160px",
                overflowY: "auto",
              }}
            >
              {versions.map((v) => (
                <div
                  key={v.version}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>v{v.version}</span>
                    <span style={{ color: "#9ca3af" }}>
                      {new Date(v.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ color: "#6b7280", margin: "0 0 4px", lineHeight: "1.4" }}>
                    &quot;{v.instruction}&quot;
                  </p>
                  <p
                    style={{
                      color: "#111",
                      margin: "0 0 4px",
                      lineHeight: "1.4",
                      fontFamily: "'Times New Roman', serif",
                    }}
                  >
                    {v.question.text.slice(0, 80)}
                    {v.question.text.length > 80 ? "..." : ""}
                  </p>
                  <button
                    onClick={() => onRevert(v)}
                    style={{
                      background: "none",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#374151",
                      padding: "2px 6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <RotateCcw size={10} />
                    Revert to v{v.version}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {question && null}
    </div>
  );
}
