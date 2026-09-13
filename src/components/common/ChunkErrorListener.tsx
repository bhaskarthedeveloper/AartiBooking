"use client";

import { useEffect } from "react";

export default function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const errorMsg = event?.message || "";
      const isChunkError =
        errorMsg.includes("Loading chunk") ||
        errorMsg.includes("Failed to fetch dynamically imported module") ||
        errorMsg.includes("ChunkLoadError");

      if (isChunkError) {
        // Prevent infinite reload loops if a chunk is permanently missing
        const storageKey = "last_chunk_reload";
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(storageKey, String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  return null;
}