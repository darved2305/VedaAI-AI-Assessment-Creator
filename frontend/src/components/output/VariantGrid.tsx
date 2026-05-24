"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import type { PaperVariant, Section } from "@/store/assignmentStore";

const VARIANT_COLORS = ["#228be6", "#e67700", "#2f9e44", "#c92a2a", "#7950f2", "#0c8599"];

interface VariantGridProps {
  variants: PaperVariant[];
}

function downloadPDF(variant: PaperVariant) {
  const sections = variant.sections
    .map((s: Section) => {
      const qs = s.questions
        .map((q) => `<li><strong>${q.number}.</strong> ${q.text}${q.options?.length ? `<ol>${q.options.map((o) => `<li>${o}</li>`).join("")}</ol>` : ""} <em>[${q.marks}m]</em></li>`)
        .join("");
      return `<div><h3>${s.label}</h3><p>${s.instruction}</p><ol style="list-style:none;padding:0;">${qs}</ol></div>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><style>body{font-family:'Times New Roman',serif;padding:40px;font-size:13px;}h2,h3{text-align:center;}@media print{body{margin:0;}}</style></head><body>
    <h2>Variant ${variant.label}</h2>
    ${sections}
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 500);
  }
}

function downloadAllZip(variants: PaperVariant[]) {
  const zipBase64 = variants[0]?.zipBase64;
  if (zipBase64) {
    const bytes = Uint8Array.from(atob(zipBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "variants.zip";
    a.click();
    URL.revokeObjectURL(url);
  } else {
    variants.forEach((v) => downloadPDF(v));
  }
}

interface QRCanvasProps {
  payload: string;
}

function QRCanvas({ payload }: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, payload, { width: 60, margin: 1 }).catch(() => {});
    });
  }, [payload]);

  return <canvas ref={canvasRef} style={{ borderRadius: "4px" }} />;
}

export default function VariantGrid({ variants }: VariantGridProps) {
  if (variants.length === 0) return null;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111", margin: 0 }}>
          {variants.length} Variants Generated
        </h3>
        <button
          onClick={() => downloadAllZip(variants)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Download size={13} />
          Download All
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {variants.map((variant, idx) => {
          const color = VARIANT_COLORS[idx % VARIANT_COLORS.length];
          const totalQ = variant.sections.reduce((s, sec) => s + sec.questions.length, 0);

          return (
            <div
              key={variant.variantId}
              style={{
                border: `2px solid ${color}`,
                borderRadius: "10px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  background: color,
                  color: "#fff",
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "14px" }}>Variant {variant.label}</span>
                {variant.qrPayload && (
                  <QRCanvas payload={variant.qrPayload} />
                )}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 4px" }}>
                  {variant.sections.length} sections · {totalQ} questions
                </p>
                <p style={{ fontSize: "10px", color: "#9ca3af", margin: "0 0 8px" }}>
                  {variant.sections.map((s) => s.label).join(", ")}
                </p>
                <button
                  onClick={() => downloadPDF(variant)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: `1px solid ${color}`,
                    color: color,
                    borderRadius: "5px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Download size={11} />
                  Download PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
