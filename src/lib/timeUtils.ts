// src/lib/timeUtils.ts

/**
 * Converts a 12-hour AM/PM time string to a 24-hour SQL time string (HH:MM:SS).
 * Examples:
 *   "08:00 AM"  -> "08:00:00"
 *   "12:00 PM"  -> "12:00:00"
 *   "06:00 PM"  -> "18:00:00"
 *   "12:00 AM"  -> "00:00:00"
 */
export function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return "00:00:00";
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  
  if (!match) {
    // If already in 24-hour format (e.g. "18:00" or "18:00:00")
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
    }
    return "00:00:00";
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridian = match[3]?.toUpperCase();

  if (meridian === "PM" && hours < 12) {
    hours += 12;
  } else if (meridian === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

/**
 * Converts a 24-hour SQL time string to a user-friendly 12-hour AM/PM string.
 * Examples:
 *   "08:00:00" -> "08:00 AM"
 *   "18:00:00" -> "06:00 PM"
 *   "00:00:00" -> "12:00 AM"
 */
export function convertTo12Hour(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";

  const meridian = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${String(hours).padStart(2, "0")}:${minutes} ${meridian}`;
}

/**
 * Parses a standard 1-hour slot string into 24-hour start and end boundary times.
 * Example:
 *   "08:00 PM - 09:00 PM" -> { startTime: "20:00:00", endTime: "21:00:00" }
 */
export function parseSlotBoundaries(slotStr: string): { startTime: string; endTime: string } {
  if (!slotStr || !slotStr.includes("-")) {
    return { startTime: "00:00:00", endTime: "00:00:00" };
  }

  const [rawStart, rawEnd] = slotStr.split("-").map((s) => s.trim());
  return {
    startTime: convertTo24Hour(rawStart),
    endTime: convertTo24Hour(rawEnd),
  };
}

/**
 * Validates whether the 'from' time is strictly before the 'to' time.
 */
export function isWindowChronological(from12h: string, to12h: string): boolean {
  const from24 = convertTo24Hour(from12h);
  const to24 = convertTo24Hour(to12h);

  // Midnight edge case: treat 12:00 AM as the end of day (24:00:00) when used as toTime
  const adjustedTo24 = to24 === "00:00:00" ? "24:00:00" : to24;
  return from24 < adjustedTo24;
}