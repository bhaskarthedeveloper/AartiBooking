import { supabase } from "@/lib/supabase";

export interface AvailabilitySlot {
  id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  emirate: string;
  area: string | null;
}

// 1. Fetch current Senapati profile
export async function fetchCurrentSenapatiProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return profile;
}

// 2. Fetch assigned Aarti events for this devotee by status
export async function fetchSenapatiEvents(
  senapatiId: string,
  status: "assigned" | "completed" | "rejectbydevote"
) {
  const { data, error } = await supabase
    .from("aarti_events")
    .select("*")
    .eq("assigned_sevadhari_id", senapatiId)
    .eq("status", status)
    .order("aarti_date", { ascending: status === "assigned" });

  if (error) throw error;
  return data || [];
}

// 3. Fetch availability slots for this Senapati
export async function fetchSenapatiAvailabilitySlots(senapatiId: string): Promise<AvailabilitySlot[]> {
  const { data, error } = await supabase
    .from("senapati_availability_slots")
    .select("id, available_date, start_time, end_time, emirate, area")
    .eq("senapati_id", senapatiId)
    .order("available_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

// 4. Reject an assigned Aarti booking
export async function rejectAartiEvent(
  eventId: string,
  senapatiName: string,
  reason: string
) {
  const { error } = await supabase
    .from("aarti_events")
    .update({
      status: "rejectbydevote",
      special_note: `Rejected by Senapati (${senapatiName}): ${reason.trim()}`,
    })
    .eq("id", eventId);

  if (error) throw error;
}

// 5. Update Senapati login password
export async function updateSenapatiPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}