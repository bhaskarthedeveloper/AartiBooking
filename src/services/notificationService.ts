// src/services/notificationService.ts

/**
 * Dispatches an asynchronous email notification to the /api/notify route.
 * Spreads payload properties at the root level while preserving the nested
 * payload object to guarantee compatibility with all server-side handlers.
 */
export async function sendNotification(
  action: string,
  payload: Record<string, any> = {}
) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        mailfor: action,
        payload,
        ...payload,
      }),
    });
  } catch (err) {
    console.error("Non-blocking notification dispatch failed:", err);
  }
}

// Alias to ensure backwards-compatibility across all service imports
export const dispatchNotification = sendNotification;