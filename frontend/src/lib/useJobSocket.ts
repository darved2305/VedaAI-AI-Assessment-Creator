"use client";

import { useEffect, useRef } from "react";
import { useAssignmentStore } from "@/store/assignmentStore";

export function useJobSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setJobStatus, setProgress } = useAssignmentStore();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "job_update") {
          setJobStatus(msg.status);
          if (msg.status === "processing") setProgress(50);
          if (msg.status === "done") setProgress(100);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      console.warn("WebSocket connection failed — real-time updates unavailable");
    };

    return () => {
      ws.close();
    };
  // setJobStatus and setProgress are stable Zustand setters — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
