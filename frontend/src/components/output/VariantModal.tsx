"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface VariantConfig {
  count: number;
  shuffleQuestions: boolean;
  shuffleMCQOptions: boolean;
  mutateNumericals: boolean;
  addQRWatermark: boolean;
}

interface VariantModalProps {
  onClose: () => void;
  onGenerate: (config: VariantConfig) => void;
  isGenerating: boolean;
  progress: { completed: number; total: number } | null;
}

export default function VariantModal({ onClose, onGenerate, isGenerating, progress }: VariantModalProps) {
  const [config, setConfig] = useState<VariantConfig>({
    count: 3,
    shuffleQuestions: true,
    shuffleMCQOptions: true,
    mutateNumericals: true,
    addQRWatermark: true,
  });

  const toggle = (key: keyof Omit<VariantConfig, "count">) =>
    setConfig((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          width: "360px",
          maxWidth: "90vw",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111", margin: 0 }}>
            Generate Variants
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
            Number of variants: <span style={{ color: "#1a1a2e" }}>{config.count}</span>
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={config.count}
            onChange={(e) => setConfig((c) => ({ ...c, count: Number(e.target.value) }))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af" }}>
            <span>2</span><span>6</span>
          </div>
        </div>

        {(
          [
            ["shuffleQuestions", "Shuffle question order"],
            ["shuffleMCQOptions", "Shuffle MCQ options"],
            ["mutateNumericals", "Mutate numerical values"],
            ["addQRWatermark", "Add QR watermark"],
          ] as [keyof Omit<VariantConfig, "count">, string][]
        ).map(([key, label]) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#374151",
            }}
          >
            <div
              onClick={() => toggle(key)}
              style={{
                width: 36,
                height: 20,
                borderRadius: "10px",
                background: config[key] ? "#1a1a2e" : "#d1d5db",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  top: 2,
                  left: config[key] ? 18 : 2,
                  transition: "left 0.2s",
                }}
              />
            </div>
            {label}
          </label>
        ))}

        {isGenerating && progress && (
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                background: "#f3f4f6",
                borderRadius: "4px",
                height: "6px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#1a1a2e",
                  height: "100%",
                  width: `${(progress.completed / progress.total) * 100}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
              {progress.completed} / {progress.total} variants generated
            </p>
          </div>
        )}

        <button
          onClick={() => onGenerate(config)}
          disabled={isGenerating}
          style={{
            width: "100%",
            padding: "10px",
            background: isGenerating ? "#f3f4f6" : "#1a1a2e",
            color: isGenerating ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isGenerating ? "not-allowed" : "pointer",
          }}
        >
          {isGenerating ? "Generating..." : `Generate ${config.count} Variants`}
        </button>
      </div>
    </div>
  );
}
