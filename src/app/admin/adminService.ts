// src/app/admin/adminService.ts
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase";
import { parseSlotBoundaries } from "@/lib/timeUtils";

export interface CandidateSenapati {
  senapati_id: string;
  name: string;
  mail: string;
  mobile: string;
  emirate: string;
  area: string | null;
  start_time: string;
  end_time: string;
}

export const BULK_TEMPLATE_HEADERS = [
  "Host Name",
  "Mobile",
  "Email",
  "Emirate",
  "Area",
  "Address",
  "Aarti Date (YYYY-MM-DD)",
  "Aarti Time (e.g. 06:00 PM - 07:00 PM)",
  "Lamps Offered",
  "Contribution (AED)",
  "Senapati Name",
  "Special Note",
];

// 1. Fetch pending Senapati applications
export async function fetchPendingSenapatis() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending_approval")
    .order("date_of_reg", { ascending: false });

  if (error) throw error;
  return data || [];
}

// 2. Fetch approved Senapatis (excluding admins)
export async function fetchApprovedSenapatis() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "approved")
    .eq("role", "senapati")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// 3. Fetch Aarti events by operational status
export async function fetchAartisByStatus(
  status: "pending" | "assigned" | "completed" | "rejectbydevote"
) {
  const { data, error } = await supabase
    .from("aarti_events")
    .select("*")
    .eq("status", status)
    .order("aarti_date", { ascending: status !== "completed" });

  if (error) throw error;
  return data || [];
}

// 4. Fetch outreach connections
export async function fetchConnectedDevotees() {
  const { data, error } = await supabase
    .from("connected_devotees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// 5. Update Senapati approval status
export async function updateSenapatiStatus(id: string, status: "approved" | "rejected") {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

// 6. Assign devotee to Aarti booking
export async function assignDevoteeToEvent(eventId: string, candidate: CandidateSenapati) {
  const { error } = await supabase
    .from("aarti_events")
    .update({
      assigned_sevadhari_id: candidate.senapati_id,
      devotee_name: candidate.name,
      status: "assigned",
    })
    .eq("id", eventId);

  if (error) throw error;
}

// 7. Find conflict-free Senapatis covering target 1-hour aarti_time
export async function findMatchingSenapatis(event: any): Promise<CandidateSenapati[]> {
  const eventDate = event.aarti_date;
  const targetEmirate = (event.emirate || "Dubai").trim();
  const timeString = event.aarti_time || "";
  const { startTime, endTime } = parseSlotBoundaries(timeString);

  // Query slots matching date, emirate, and covering the required time window
  const { data: slotRecords, error: slotError } = await supabase
    .from("senapati_availability_slots")
    .select(`
      senapati_id,
      emirate,
      area,
      start_time,
      end_time,
      profiles!inner (
        id,
        name,
        mail,
        mobile,
        status,
        role
      )
    `)
    .eq("available_date", eventDate)
    .ilike("emirate", `%${targetEmirate}%`)
    .lte("start_time", startTime)
    .gte("end_time", endTime);

  if (slotError) throw slotError;

  // Filter approved Senapatis
  const candidatesMap = new Map<string, CandidateSenapati>();
  (slotRecords || []).forEach((row: any) => {
    const prof = row.profiles;
    if (prof?.status === "approved" && prof?.role === "senapati" && !candidatesMap.has(prof.id)) {
      candidatesMap.set(prof.id, {
        senapati_id: prof.id,
        name: prof.name,
        mail: prof.mail,
        mobile: prof.mobile,
        emirate: row.emirate,
        area: row.area,
        start_time: row.start_time,
        end_time: row.end_time,
      });
    }
  });

  const candidateIds = Array.from(candidatesMap.keys());
  if (candidateIds.length === 0) {
    return [];
  }

  // Check existing assigned/completed bookings on this date for conflict
  const { data: existingBookings, error: bookingError } = await supabase
    .from("aarti_events")
    .select("assigned_sevadhari_id, aarti_time")
    .eq("aarti_date", eventDate)
    .in("assigned_sevadhari_id", candidateIds)
    .in("status", ["assigned", "completed"]);

  if (bookingError) throw bookingError;

  const busyDevoteeIds = new Set<string>();
  (existingBookings || []).forEach((booking) => {
    const bookingTimes = parseSlotBoundaries(booking.aarti_time || "");
    if (bookingTimes.startTime < endTime && bookingTimes.endTime > startTime) {
      busyDevoteeIds.add(booking.assigned_sevadhari_id);
    }
  });

  return Array.from(candidatesMap.values()).filter(
    (c) => !busyDevoteeIds.has(c.senapati_id)
  );
}

// 8. Generate and trigger download of clean Excel template using exceljs
export async function downloadBulkUploadTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Offline_Aartis");

  worksheet.columns = BULK_TEMPLATE_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 5, 18),
  }));

  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };

  worksheet.addRow({
    "Host Name": "Ramesh Sharma",
    "Mobile": "0501234567",
    "Email": "ramesh@example.com",
    "Emirate": "Dubai",
    "Area": "Bur Dubai",
    "Address": "Flat 204, Al Khaleej Building",
    "Aarti Date (YYYY-MM-DD)": "2026-10-25",
    "Aarti Time (e.g. 06:00 PM - 07:00 PM)": "06:00 PM - 07:00 PM",
    "Lamps Offered": "25",
    "Contribution (AED)": 100,
    "Senapati Name": "Radheshyam Das",
    "Special Note": "Grand kirtan and prasadam distributed",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Aarti_Bulk_Upload_Template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// 9. Parse, validate, and bulk insert completed Aartis using exceljs
export async function processBulkUpload(file: File): Promise<{ inserted: number; errors: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount <= 1) {
    throw new Error("The uploaded Excel sheet contains no data rows.");
  }

  const headerRow = worksheet.getRow(1);
  const fileHeaders: string[] = [];
  headerRow.eachCell((cell) => {
    fileHeaders.push(String(cell.value || "").trim());
  });

  const missingHeaders = BULK_TEMPLATE_HEADERS.filter((h) => !fileHeaders.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Invalid template format. Missing mandatory columns: ${missingHeaders.join(", ")}`);
  }

  const errors: string[] = [];
  const recordsToInsert: any[] = [];

  const headerIndexMap: { [key: string]: number } = {};
  fileHeaders.forEach((h, idx) => {
    headerIndexMap[h] = idx + 1;
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const getVal = (header: string): string => {
      const colIdx = headerIndexMap[header];
      if (!colIdx) return "";
      const cell = row.getCell(colIdx);
      if (cell.value === null || cell.value === undefined) return "";
      if (typeof cell.value === "object" && "text" in cell.value) return String(cell.value.text).trim();
      return String(cell.value).trim();
    };

    const hostName = getVal("Host Name");
    const mobile = getVal("Mobile");
    let aartiDate = getVal("Aarti Date (YYYY-MM-DD)");
    const aartiTime = getVal("Aarti Time (e.g. 06:00 PM - 07:00 PM)");

    if (!hostName && !mobile && !aartiDate) {
      return;
    }

    if (!hostName || !mobile || !aartiDate || !aartiTime) {
      errors.push(`Row ${rowNumber}: Host Name, Mobile, Aarti Date, and Aarti Time are mandatory.`);
      return;
    }

    if (aartiDate.includes("T")) {
      aartiDate = aartiDate.split("T")[0];
    }

    const token = `DIR-${Math.floor(100000 + Math.random() * 900000)}`;
    const datewiseInt = parseInt(aartiDate.replace(/\D/g, ""), 10) || 0;

    recordsToInsert.push({
      full_name: hostName,
      mobile: mobile,
      email: getVal("Email"),
      emirate: getVal("Emirate") || "Dubai",
      city: getVal("Area") || "Dubai",
      address: getVal("Address"),
      aarti_date: aartiDate,
      aarti_time: aartiTime,
      token,
      datewise: datewiseInt,
      devotee_name: getVal("Senapati Name") || "Admin Upload",
      no_of_lamps: getVal("Lamps Offered") || "0",
      contribution: parseFloat(getVal("Contribution (AED)")) || 0.0,
      special_note: getVal("Special Note"),
      status: "completed",
      registration_mode: "bulk_offline_upload",
    });
  });

  if (recordsToInsert.length === 0) {
    throw new Error(`No valid records could be processed. Errors:\n${errors.join("\n")}`);
  }

  const { error: insertErr } = await supabase.from("aarti_events").insert(recordsToInsert);
  if (insertErr) throw insertErr;

  return { inserted: recordsToInsert.length, errors };
}