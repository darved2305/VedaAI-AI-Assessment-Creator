"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export default function FileUpload({ value, onChange }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center py-8 px-6 text-center transition-colors"
        style={{
          border: `1.5px dashed ${dragging ? "var(--color-accent)" : "var(--color-upload-border)"}`,
          borderRadius: "var(--radius-md)",
          background: dragging ? "var(--color-accent-light)" : "var(--color-upload-bg)",
          cursor: value ? "default" : "pointer",
        }}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ background: "var(--color-border-light)", border: "1px solid var(--color-border)" }}
            >
              <UploadCloud size={16} style={{ color: "var(--color-accent)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {value.name}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud
              size={32}
              strokeWidth={1.5}
              style={{ color: "var(--color-text-subtle)" }}
            />
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Choose a file or drag &amp; drop it here
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-subtle)" }}
            >
              JPEG, PNG, upto 10MB
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="mt-4 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              Browse Files
            </button>
          </>
        )}
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
        Upload images of your preferred document/image
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
