"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Plus, Mic, MicOff, Calendar } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import FileUpload from "@/components/create/FileUpload";
import QuestionTypeRow from "@/components/create/QuestionTypeRow";
import { useAssignmentStore } from "@/store/assignmentStore";
import { assignmentsApi } from "@/lib/api";

function parseDDMMYYYY(s: string): Date | null {
  const p = s.split("-");
  if (p.length !== 3) return null;
  const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  return isNaN(d.getTime()) ? null : d;
}

const schema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Use DD-MM-YYYY format")
    .refine(
      (val) => {
        const d = parseDDMMYYYY(val);
        return d !== null;
      },
      { message: "Invalid date" }
    )
    .refine(
      (val) => {
        const d = parseDDMMYYYY(val);
        if (!d) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
      { message: "Due date cannot be in the past" }
    ),
  instructions: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// SpeechRecognition type declarations
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: {
    resultIndex: number;
    results: { isFinal: boolean; 0: { transcript: string } }[];
  }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export default function CreatePage() {
  const router = useRouter();
  const {
    form,
    setForm,
    addQuestionType,
    removeQuestionType,
    updateQuestionType,
    setJobStatus,
  } = useAssignmentStore();

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigatedRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: form.title ?? "",
      dueDate: form.dueDate,
      instructions: form.instructions,
    },
  });

  watch("instructions");

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    setVoiceSupported(!!SR);
  }, []);

  const totalQuestions = form.questionTypes.reduce(
    (s, r) => s + r.numQuestions,
    0
  );
  const totalMarks = form.questionTypes.reduce(
    (s, r) => s + r.numQuestions * r.marks,
    0
  );

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = getValues("instructions") ?? "";

    recognition.onresult = (event: {
      resultIndex: number;
      results: Array<{ isFinal: boolean; 0: { transcript: string } }>;
    }) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      setValue("instructions", finalTranscript + interim, {
        shouldValidate: false,
      });
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setValue("instructions", finalTranscript.trim(), {
        shouldValidate: false,
      });
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
  }

  const navigateToDone = useCallback(
    (assignmentId: string) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      wsRef.current?.close();
      router.push(`/output/${assignmentId}`);
    },
    [router]
  );

  const connectJobSocket = useCallback(
    (assignmentId: string) => {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string);
            if (msg.type === "job_update" && msg.assignmentId === assignmentId) {
              setJobStatus(msg.status);
              if (msg.status === "done") navigateToDone(assignmentId);
              if (msg.status === "failed") {
                ws.close();
                setLoading(false);
                setSubmitError("AI generation failed. Please try again.");
              }
            }
          } catch {
            /* ignore parse errors */
          }
        };

        ws.onerror = () => {
          /* WebSocket error — polling fallback is active */
        };
      } catch {
        /* WebSocket unavailable — polling fallback handles it */
      }
    },
    [setJobStatus, navigateToDone]
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  async function onSubmit(values: FormValues) {
    if (form.questionTypes.length === 0) {
      setSubmitError("Add at least one question type.");
      return;
    }

    setLoading(true);
    setSubmitError(null);
    navigatedRef.current = false;

    setForm({
      title: values.title,
      dueDate: values.dueDate,
      instructions: values.instructions ?? "",
    });
    setJobStatus("queued");

    try {
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("dueDate", values.dueDate);
      fd.append(
        "questionTypes",
        JSON.stringify(
          form.questionTypes.map(({ type, numQuestions, marks }) => ({
            type,
            numQuestions,
            marks,
          }))
        )
      );
      fd.append("instructions", values.instructions ?? "");
      if (form.file) fd.append("file", form.file);

      const { assignmentId } = await assignmentsApi.create(fd);
      setJobStatus("processing");

      connectJobSocket(assignmentId);

      // Polling fallback — clears itself once navigation happens
      pollRef.current = setInterval(async () => {
        if (navigatedRef.current) {
          clearInterval(pollRef.current!);
          return;
        }
        try {
          const { assignment } = await assignmentsApi.get(assignmentId);
          if (assignment.status === "done") {
            navigateToDone(assignmentId);
          } else if (assignment.status === "failed") {
            clearInterval(pollRef.current!);
            setLoading(false);
            setSubmitError("AI generation failed. Please try again.");
          }
        } catch {
          /* ignore poll errors */
        }
      }, 4000);

      // Hard cap at 3 minutes
      setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
      }, 180_000);
    } catch (err: unknown) {
      setLoading(false);
      setJobStatus("failed");
      const msg =
        err instanceof Error ? err.message : "Failed to create assignment.";
      setSubmitError(msg);
    }
  }

  return (
    <PageShell breadcrumb="Assignment" mobileShowBack mobileTitle="Create Assignment">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: "var(--color-green)" }}
            />
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Create Assignment
            </h1>
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)", marginLeft: "1.35rem" }}
          >
            Set up a new assignment for your students.
          </p>
          {/* Progress bar */}
          <div
            className="mt-4 h-1 rounded-full"
            style={{ background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: loading ? "90%" : "50%",
                background: "var(--color-btn-primary)",
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            className="p-5 sm:p-7"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="mb-6">
              <h2
                className="text-base font-semibold mb-0.5"
                style={{ color: "var(--color-text-primary)" }}
              >
                Assignment Details
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Basic information about your assignment
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Assignment Title */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Mid-Term – Class 8"
                  {...register("title")}
                  className="w-full px-3 py-2.5 text-sm rounded-lg"
                  style={{
                    border: `1px solid ${
                      errors.title
                        ? "var(--color-red)"
                        : "var(--color-border)"
                    }`,
                    color: "var(--color-text-primary)",
                    background: "var(--color-surface)",
                  }}
                />
                {errors.title && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-red)" }}
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <FileUpload
                value={form.file}
                onChange={(file) => setForm({ file })}
              />

              {/* Due Date */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    {...register("dueDate")}
                    className="w-full pr-10 pl-3 py-2.5 text-sm rounded-lg"
                    style={{
                      border: `1px solid ${
                        errors.dueDate
                          ? "var(--color-red)"
                          : "var(--color-border)"
                      }`,
                      color: "var(--color-text-primary)",
                      background: "var(--color-surface)",
                    }}
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-subtle)" }}
                  />
                </div>
                {errors.dueDate && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-red)" }}
                  >
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              {/* Question Types */}
              <div>
                <div
                  className="grid items-center gap-3 mb-3"
                  style={{ gridTemplateColumns: "1fr auto auto" }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Question Type
                  </span>
                  <span
                    className="text-xs font-medium text-center"
                    style={{
                      color: "var(--color-text-muted)",
                      minWidth: "86px",
                    }}
                  >
                    No. of Questions
                  </span>
                  <span
                    className="text-xs font-medium text-center"
                    style={{
                      color: "var(--color-text-muted)",
                      minWidth: "86px",
                    }}
                  >
                    Marks
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {form.questionTypes.map((row) => (
                    <QuestionTypeRow
                      key={row.id}
                      row={row}
                      onRemove={() => removeQuestionType(row.id)}
                      onChange={(patch) =>
                        updateQuestionType(row.id, patch)
                      }
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestionType}
                  className="flex items-center gap-2 mt-4 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      border: "1.5px solid var(--color-text-primary)",
                    }}
                  >
                    <Plus size={11} strokeWidth={2.5} />
                  </span>
                  Add Question Type
                </button>

                <div
                  className="flex flex-col items-end gap-0.5 mt-4 pt-4 text-sm"
                  style={{ borderTop: "1px solid var(--color-border-light)" }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Total Questions :{" "}
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {totalQuestions}
                    </span>
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Total Marks :{" "}
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {totalMarks}
                    </span>
                  </span>
                </div>
              </div>

              {/* Additional Information with Voice Recording */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Additional Information{" "}
                  <span
                    style={{
                      color: "var(--color-text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    (For better output)
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    placeholder="e.g. Generate a question paper for 3 hour exam duration, CBSE Grade 8 Science, Chapter: Metals and Non-Metals..."
                    rows={4}
                    {...register("instructions")}
                    className="w-full px-3 py-2.5 text-sm resize-none pb-10 rounded-lg"
                    style={{
                      border: `1px solid ${
                        isRecording
                          ? "var(--color-accent)"
                          : "var(--color-border)"
                      }`,
                      color: "var(--color-text-primary)",
                      background: "var(--color-surface)",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {isRecording && (
                      <span
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: "var(--color-accent)" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Recording...
                      </span>
                    )}
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={toggleRecording}
                        title={
                          isRecording
                            ? "Stop recording"
                            : "Record instructions by voice"
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                        style={{
                          background: isRecording
                            ? "var(--color-accent)"
                            : "var(--color-border-light)",
                          color: isRecording
                            ? "#fff"
                            : "var(--color-text-subtle)",
                          border: isRecording
                            ? "none"
                            : "1px solid var(--color-border)",
                        }}
                      >
                        {isRecording ? (
                          <MicOff size={13} />
                        ) : (
                          <Mic size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {isRecording && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    Speak clearly — your voice is being transcribed in real
                    time. Click the mic again to stop.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <p
              className="mt-3 text-sm text-center"
              style={{ color: "var(--color-red)" }}
            >
              {submitError}
            </p>
          )}

          {/* Loading status */}
          {loading && (
            <div
              className="mt-3 text-sm text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full animate-pulse"
                  style={{ background: "var(--color-accent)" }}
                />
                Generating your question paper with AI...
              </span>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => router.push("/assignments")}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100 rounded-full"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                background: "var(--color-surface)",
              }}
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 rounded-full"
              style={{
                background: "var(--color-btn-primary)",
                color: "#FFFFFF",
              }}
            >
              {loading ? "Generating..." : "Next"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
