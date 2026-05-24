"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import type { Question, QuestionVersion } from "@/store/assignmentStore";
import BloomsBadge from "./BloomsBadge";
import RefinePanel from "./RefinePanel";

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#16A34A",
  Moderate: "#D97706",
  Challenging: "#DC2626",
};

interface QuestionCardProps {
  question: Question;
  assignmentId: string;
  questionId: string;
  versions: QuestionVersion[];
  isRefining: boolean;
  streamBuffer: string;
  onRefine: (instruction: string) => void;
  onRevert: (version: QuestionVersion) => void;
}

export default function QuestionCard({
  question,
  assignmentId,
  questionId,
  versions,
  isRefining,
  streamBuffer,
  onRefine,
  onRevert,
}: QuestionCardProps) {
  const [showRefine, setShowRefine] = useState(false);

  return (
    <div style={{ marginBottom: "4px" }}>
      <div
        style={{
          borderRadius: showRefine ? "8px 8px 0 0" : "8px",
          border: showRefine ? "1px solid #e5e7eb" : "none",
          borderBottom: showRefine ? "none" : undefined,
          padding: showRefine ? "6px 10px" : 0,
          background: showRefine ? "#fff" : "transparent",
        }}
      >
        <li
          className="text-sm leading-relaxed"
          style={{ listStyle: "none", display: "flex", gap: "6px", alignItems: "flex-start" }}
        >
          <div style={{ flex: 1 }}>
            <span className="font-semibold">{question.number}.</span>{" "}
            <span
              className="text-xs font-semibold"
              style={{ color: DIFFICULTY_COLOR[question.difficulty] ?? "#333" }}
            >
              [{question.difficulty}]
            </span>{" "}
            {question.bloomsLevel && (
              <>
                <BloomsBadge level={question.bloomsLevel} small />{" "}
              </>
            )}
            {isRefining && streamBuffer ? (
              <span style={{ opacity: 0.6, fontStyle: "italic" }}>
                {streamBuffer}
                <span style={{ opacity: 0.4 }}>▋</span>
              </span>
            ) : (
              question.text
            )}{" "}
            <span className="font-medium">[{question.marks} Marks]</span>
            {question.options && question.options.length > 0 && (
              <ol className="mt-1 ml-5 flex flex-col gap-0.5">
                {question.options.map((opt, oi) => (
                  <li key={oi} className="text-sm">
                    {opt}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <button
            onClick={() => setShowRefine((v) => !v)}
            disabled={isRefining}
            title="Refine this question"
            style={{
              background: showRefine ? "#1a1a2e" : "#f3f4f6",
              color: showRefine ? "#fff" : "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "5px",
              padding: "3px 7px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: isRefining ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              flexShrink: 0,
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: isRefining ? 0.5 : 1,
            }}
          >
            <Wand2 size={11} />
            Refine
          </button>
        </li>
      </div>

      {showRefine && (
        <RefinePanel
          question={question}
          assignmentId={assignmentId}
          questionId={questionId}
          versions={versions}
          isRefining={isRefining}
          streamBuffer={streamBuffer}
          onRefine={onRefine}
          onRevert={onRevert}
        />
      )}
    </div>
  );
}
