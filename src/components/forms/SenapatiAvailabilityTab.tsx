"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { KARTHIK_START_DATE, KARTHIK_END_DATE, FORM_CONTENT } from "@/lib/constants";
import { convertTo24Hour, convertTo12Hour, isWindowChronological } from "@/lib/timeUtils";

interface AvailabilitySlot {
  id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  emirate: string;
  area: string | null;
}

interface SenapatiAvailabilityTabProps {
  profile: any;
  slotsList: AvailabilitySlot[];
  onSlotsUpdated: () => Promise<void>;
}

export default function SenapatiAvailabilityTab({
  profile,
  slotsList,
  onSlotsUpdated,
}: SenapatiAvailabilityTabProps) {
  const [fromTime, setFromTime] = useState("08:00 AM");
  const [toTime, setToTime] = useState("12:00 PM");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Generate full range of dates in Karthika month
  const karthikaDates: string[] = useMemo(() => {
    const list: string[] = [];
    const cur = new Date(KARTHIK_START_DATE);
    const end = new Date(KARTHIK_END_DATE);
    while (cur <= end) {
      list.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, []);

  const toggleDateSelection = (d: string) => {
    if (selectedDates.includes(d)) {
      setSelectedDates(selectedDates.filter((x) => x !== d));
    } else {
      setSelectedDates([...selectedDates, d].sort());
    }
  };

  const handleSelectAll = () => setSelectedDates([...karthikaDates]);
  const handleClearAll = () => setSelectedDates([]);

  const handleSelectWeekends = () => {
    const weekends = karthikaDates.filter((d) => {
      const day = new Date(d).getDay();
      return day === 0 || day === 6;
    });
    setSelectedDates(Array.from(new Set([...selectedDates, ...weekends])).sort());
  };

  const handleSelectWeekdays = () => {
    const weekdays = karthikaDates.filter((d) => {
      const day = new Date(d).getDay();
      return day >= 1 && day <= 5;
    });
    setSelectedDates(Array.from(new Set([...selectedDates, ...weekdays])).sort());
  };

  const handleSaveSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);
    setSuccessNotice(null);

    if (selectedDates.length === 0) {
      setConflictWarning("Please select at least one date for this time window.");
      return;
    }

    if (!isWindowChronological(fromTime, toTime)) {
      setConflictWarning("The 'To' time must be strictly after the 'From' time.");
      return;
    }

    setSaveLoading(true);
    try {
      const newStart24 = convertTo24Hour(fromTime);
      const newEnd24 = convertTo24Hour(toTime);

      // Fetch existing slots for this user on the selected dates
      const { data: existingSlots, error: fetchErr } = await supabase
        .from("senapati_availability_slots")
        .select("*")
        .eq("senapati_id", profile.id)
        .in("available_date", selectedDates);

      if (fetchErr) throw fetchErr;

      const rowsToUpsert: any[] = [];
      const idsToDelete: string[] = [];

      for (const dateStr of selectedDates) {
        const daySlots = (existingSlots || []).filter(
          (s) => s.available_date === dateStr
        );

        let mergedStart = newStart24;
        let mergedEnd = newEnd24;

        for (const slot of daySlots) {
          const slotStart = slot.start_time;
          const slotEnd = slot.end_time;

          const hasOverlapOrTouch = slotStart <= mergedEnd && slotEnd >= mergedStart;

          if (hasOverlapOrTouch) {
            mergedStart = slotStart < mergedStart ? slotStart : mergedStart;
            mergedEnd = slotEnd > mergedEnd ? slotEnd : mergedEnd;
            idsToDelete.push(slot.id);
          }
        }

        rowsToUpsert.push({
          senapati_id: profile.id,
          available_date: dateStr,
          start_time: mergedStart,
          end_time: mergedEnd,
          emirate: profile.city || "Dubai",
          area: profile.area || profile.city || null,
        });
      }

      if (idsToDelete.length > 0) {
        const { error: deleteErr } = await supabase
          .from("senapati_availability_slots")
          .delete()
          .in("id", idsToDelete);

        if (deleteErr) throw deleteErr;
      }

      const { error: upsertErr } = await supabase
        .from("senapati_availability_slots")
        .upsert(rowsToUpsert, {
          onConflict: "senapati_id,available_date,start_time,end_time",
          ignoreDuplicates: true,
        });

      if (upsertErr) throw upsertErr;

      setSelectedDates([]);
      setSuccessNotice(`Saved availability across ${rowsToUpsert.length} date(s).`);
      await onSlotsUpdated();
    } catch (err: any) {
      setConflictWarning(err.message || "Failed to save availability slots.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingId(slotId);
    await supabase.from("senapati_availability_slots").delete().eq("id", slotId);
    await onSlotsUpdated();
    setDeletingId(null);
  };

  const handleDeleteSlotGroup = async (slotIds: string[]) => {
    if (!confirm(`Are you sure you want to delete all ${slotIds.length} dates in this time slot?`)) return;
    await supabase.from("senapati_availability_slots").delete().in("id", slotIds);
    await onSlotsUpdated();
  };

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: { start: string; end: string; dates: { id: string; date: string }[] } } = {};
    slotsList.forEach((s) => {
      const start12 = convertTo12Hour(s.start_time);
      const end12 = convertTo12Hour(s.end_time);
      const key = `${start12} - ${end12}`;
      if (!groups[key]) {
        groups[key] = { start: start12, end: end12, dates: [] };
      }
      groups[key].dates.push({ id: s.id, date: s.available_date });
    });
    return Object.values(groups);
  }, [slotsList]);

  return (
    <div className="max-w-4xl bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Define Karthika Availability</h2>
        <p className="text-[11px] text-slate-500">
          Active Karthika Window: <strong>{KARTHIK_START_DATE}</strong> to <strong>{KARTHIK_END_DATE}</strong>.
          Select an hour range and tap multiple dates to register availability slots[cite: 8]. Overlapping hours on the same date merge automatically[cite: 8].
        </p>
      </div>

      {conflictWarning && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold">
          {conflictWarning}
        </div>
      )}

      {successNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
          {successNotice}
        </div>
      )}

      <form onSubmit={handleSaveSlots} className="space-y-4 border p-4 rounded-xl bg-slate-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Available From *</label>
            <select
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white text-xs font-semibold cursor-pointer"
            >
              {(FORM_CONTENT?.TIME_OPTIONS || []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Available To *</label>
            <select
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white text-xs font-semibold cursor-pointer"
            >
              {(FORM_CONTENT?.TIME_OPTIONS || []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-bold text-slate-700 uppercase">
              Select Dates for this Slot Window ({selectedDates.length} Selected)
            </label>
            <div className="space-x-1">
              <button type="button" onClick={handleSelectWeekends} className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[10px] hover:bg-sky-200 cursor-pointer">+ Weekends</button>
              <button type="button" onClick={handleSelectWeekdays} className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold text-[10px] hover:bg-slate-300 cursor-pointer">+ Weekdays</button>
              <button type="button" onClick={handleSelectAll} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] hover:bg-emerald-200 cursor-pointer">Select All</button>
              <button type="button" onClick={handleClearAll} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px] hover:bg-rose-200 cursor-pointer">Clear</button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 p-3 bg-white border rounded-lg max-h-56 overflow-y-auto">
            {karthikaDates.map((dateStr) => {
              const isSelected = selectedDates.includes(dateStr);
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = dateStr.slice(8);
              const monthName = d.toLocaleDateString("en-US", { month: "short" });

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => toggleDateSelection(dateStr)}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-[rgb(23,91,126)] text-white border-[rgb(23,91,126)] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[9px] uppercase font-semibold">{dayName}</span>
                  <span className="text-sm font-extrabold">{dayNum}</span>
                  <span className="text-[9px] opacity-80">{monthName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={saveLoading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          {saveLoading
            ? "Saving Availability..."
            : `Save Availability (${fromTime} to ${toTime} for ${selectedDates.length} Dates)`}
        </button>
      </form>

      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-slate-800 uppercase text-xs">
          My Registered Availability Slots ({slotsList.length} total entries)
        </h3>

        {groupedSlots.length === 0 ? (
          <p className="text-slate-400 italic">No availability recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {groupedSlots.map((group, idx) => (
              <div key={idx} className="p-4 border rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold text-slate-900 text-xs">
                    ⏰ {group.start} to {group.end}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {group.dates.length} dates
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlotGroup(group.dates.map((d) => d.id))}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                    >
                      Delete Window
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.dates.map((item) => (
                    <span
                      key={item.id}
                      className="bg-white border text-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1.5 shadow-2xs"
                    >
                      {item.date}
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteSlot(item.id)}
                        className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer disabled:opacity-30"
                        title="Delete this date"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}