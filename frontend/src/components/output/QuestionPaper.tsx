import type { QuestionPaper as PaperType } from "@/store/assignmentStore";

interface QuestionPaperProps {
  paper: PaperType;
}

const difficultyColor: Record<string, string> = {
  Easy: "#16A34A",
  Moderate: "#D97706",
  Challenging: "#DC2626",
};

export default function QuestionPaper({ paper }: QuestionPaperProps) {
  return (
    <div
      className="question-paper-wrapper bg-white mx-auto"
      style={{
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        padding: "40px 48px",
        maxWidth: "780px",
        fontFamily: "'Times New Roman', Georgia, serif",
        fontSize: "13.5px",
        lineHeight: "1.6",
        color: "#111",
      }}
    >
      {/* School header */}
      <div className="text-center mb-3">
        <h1 className="font-bold text-base leading-snug">{paper.schoolName}</h1>
        <p className="text-sm mt-0.5">Subject: {paper.subject}</p>
        <p className="text-sm">Class: {paper.className}</p>
      </div>

      {/* Time / Marks bar */}
      <div
        className="flex justify-between text-sm py-2 mb-3"
        style={{ borderTop: "1.5px solid #333", borderBottom: "1.5px solid #333" }}
      >
        <span>Time Allowed: {paper.timeAllowed}</span>
        <span>Maximum Marks: {paper.maxMarks}</span>
      </div>

      {/* Instructions */}
      <p className="text-sm italic mb-4">All questions are compulsory unless stated otherwise.</p>

      {/* Student info */}
      <div className="mb-5 text-sm flex flex-col gap-1">
        <span>
          Name:{" "}
          <span
            style={{
              borderBottom: "1px solid #333",
              display: "inline-block",
              width: "160px",
            }}
          >
            &nbsp;
          </span>
        </span>
        <span>
          Roll Number:{" "}
          <span
            style={{
              borderBottom: "1px solid #333",
              display: "inline-block",
              width: "140px",
            }}
          >
            &nbsp;
          </span>
        </span>
        <span>
          Class: {paper.className} &nbsp; Section:{" "}
          <span
            style={{
              borderBottom: "1px solid #333",
              display: "inline-block",
              width: "80px",
            }}
          >
            &nbsp;
          </span>
        </span>
      </div>

      {/* Sections */}
      {paper.sections.map((section, sIdx) => {
        const lines = section.instruction.split("\n").filter(Boolean);
        const isLast = sIdx === paper.sections.length - 1;
        return (
          <div key={section.label} className="mb-5">
            <h2 className="text-center font-bold text-sm mb-1.5">{section.label}</h2>
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-sm mb-1"
                style={{ fontWeight: i === 0 ? 600 : 400 }}
              >
                {line}
              </p>
            ))}
            <ol className="flex flex-col gap-2 mt-2">
              {section.questions.map((q) => (
                <li key={q.number} className="text-sm leading-relaxed">
                  <span className="font-semibold">{q.number}.</span>{" "}
                  <span
                    className="text-xs font-semibold"
                    style={{ color: difficultyColor[q.difficulty] ?? "#333" }}
                  >
                    [{q.difficulty}]
                  </span>{" "}
                  {q.text}{" "}
                  <span className="font-medium">[{q.marks} Marks]</span>
                  {q.options && q.options.length > 0 && (
                    <ol className="mt-1 ml-5 flex flex-col gap-0.5">
                      {q.options.map((opt, oi) => (
                        <li key={oi} className="text-sm">
                          {opt}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
            {isLast && (
              <p className="text-center font-semibold text-sm mt-5">
                End of Question Paper
              </p>
            )}
          </div>
        );
      })}

      {/* Answer Key */}
      {paper.answerKey.length > 0 && (
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid #E5E7EB" }}>
          <h3 className="font-bold text-base mb-3">Answer Key:</h3>
          <ol className="flex flex-col gap-2">
            {paper.answerKey.map((ans, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="font-semibold">{i + 1}.</span> {ans}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
