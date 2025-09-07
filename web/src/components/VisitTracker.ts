"use client";
import { useEffect } from "react";

export default function VisitTracker({ croId, projectId }: { croId: string; projectId?: string }) {
  useEffect(() => {
    if (!projectId) return;
    fetch("/api/notify/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cro_id: croId, project_id: projectId }),
    }).catch(() => {});
  }, [croId, projectId]);
  return null;
}
