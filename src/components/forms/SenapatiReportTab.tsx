"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/services/notificationService";
import {
  FIELD_LIMITS,
  validateFullName,
  validateEmail,
  validateUAEMobile,
  validateAddress,
  sanitizeAlphaOnly,
  sanitizeAddress,
  sanitizeTextOnly,
} from "@/lib/validation";
import { KARTHIK_END_DATE, KARTHIK_START_DATE, FORM_CONTENT } from "@/lib/constants";

interface SenapatiReportTabProps {
  profile: any;
  onSuccess?: () => void;
}

export default function SenapatiReportTab({ profile, onSuccess }: SenapatiReportTabProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    hostName: "",
    mobile: "05",
    email: "",
    address: "",
    aartiDate: KARTHIK_START_DATE,
    aartiTime: FORM_CONTENT.timeSlots[0] || "08:00 AM - 09:00 AM",
    noOfLamps: "",
    contribution: "0.00",
    specialNote: "",
  });

  useEffect(() => {
    async function fetchAssigned() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("aarti_events")
        .select("*")
        .eq("assigned_sevadhari_id", profile.id)
        .eq("status", "assigned")
        .order("aarti_date", { ascending: true });
      setAssignedBookings(data || []);
    }
    fetchAssigned();
  }, [profile]);

  const handleBookingSelect = (id: string) => {
    setSelectedBookingId(id);
    const selected = assignedBookings.find((b) => b.id === id);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        hostName: selected.full_name,
        mobile: selected.mobile,
        email: selected.email,
        address: selected.address,
        aartiDate: selected.aarti_date,
        aartiTime: selected.aarti_time,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "hostName") {
      setFormData((prev) => ({
        ...prev,
        hostName: sanitizeAlphaOnly(value).slice(0, FIELD_LIMITS.name),
      }));
      return;
    }

    if (name === "mobile") {
      let digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.startsWith("05")) {
        digitsOnly = digitsOnly.slice(2);
      }
      digitsOnly = digitsOnly.slice(0, FIELD_LIMITS.mobileDigitsAfterPrefix);
      setFormData((prev) => ({ ...prev, mobile: `05${digitsOnly}` }));
      return;
    }

    if (name === "address") {
      setFormData((prev) => ({
        ...prev,
        address: sanitizeAddress(value).slice(0, FIELD_LIMITS.address),
      }));
      return;
    }

    if (name === "specialNote") {
      setFormData((prev) => ({
        ...prev,
        specialNote: sanitizeTextOnly(value).slice(0, FIELD_LIMITS.notes),
      }));
      return;
    }

    if (name === "noOfLamps") {
      setFormData((prev) => ({
        ...prev,
        noOfLamps: value.replace(/\D/g, "").slice(0, FIELD_LIMITS.noOfLamps),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isOffline) {
      const nameErr = validateFullName(formData.hostName);
      const emailErr = validateEmail(formData.email);
      const mobileErr = validateUAEMobile(formData.mobile);
      const addrErr = validateAddress(formData.address);

      if (nameErr || emailErr || mobileErr || addrErr) {
        setMessage({ type: "error", text: nameErr || emailErr || mobileErr || addrErr || "Validation error" });
        setLoading(false);
        return;
      }
    }

    try {
      if (isOffline) {
        const token = `DIR-${Math.floor(100000 + Math.random() * 900000)}`;
        const datewise = parseInt(formData.aartiDate.replace(/-/g, ""), 10);

        const { error } = await supabase.from("aarti_events").insert([
          {
            assigned_sevadhari_id: profile.id,
            devotee_name: profile.name,
            full_name: formData.hostName.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim(),
            address: formData.address.trim(),
            emirate: profile.city || "Dubai",
            city: profile.area || profile.city || "Dubai",
            aarti_date: formData.aartiDate,
            aarti_time: formData.aartiTime,
            token,
            datewise,
            no_of_lamps: formData.noOfLamps.trim(),
            contribution: parseFloat(formData.contribution) || 0.0,
            special_note: formData.specialNote.trim(),
            status: "completed",
            registration_mode: "direct_sevadhari_report",
          },
        ]);
        if (error) throw error;

        // Notification 1: Direct Offline Aarti Report
        sendNotification("direct_offline_aarti", {
          sanname: profile?.name || "Devotee",
          host: formData.hostName.trim(),
          usermail: formData.email.trim(),
          address: `${formData.address.trim()}, ${profile.city || "Dubai"}`,
          date: formData.aartiDate,
          time: formData.aartiTime,
          noOfLamps: formData.noOfLamps.trim(),
          contribution: formData.contribution,
        });
      } else {
        if (!selectedBookingId) throw new Error("Please select an assigned booking.");

        const selected = assignedBookings.find((b) => b.id === selectedBookingId);

        const { error } = await supabase
          .from("aarti_events")
          .update({
            no_of_lamps: formData.noOfLamps.trim(),
            contribution: parseFloat(formData.contribution) || 0.0,
            special_note: formData.specialNote.trim(),
            status: "completed",
          })
          .eq("id", selectedBookingId);
        if (error) throw error;

        // Notification 2: Assigned Booking Completion Report
        sendNotification("report_Aarti", {
          sanname: profile?.name || "Devotee",
          host: selected?.full_name || formData.hostName,
          usermail: selected?.email || formData.email,
          address: selected?.address || formData.address,
          date: selected?.aarti_date || formData.aartiDate,
          time: selected?.aarti_time || formData.aartiTime,
          noOfLamps: formData.noOfLamps.trim(),
          contribution: formData.contribution,
          isregister: "Yes",
        });
      }

      setMessage({ type: "success", text: "Aarti reported successfully! Hare Krishna." });
      setFormData({
        hostName: "",
        mobile: "05",
        email: "",
        address: "",
        aartiDate: KARTHIK_START_DATE,
        aartiTime: FORM_CONTENT.timeSlots[0] || "08:00 AM - 09:00 AM",
        noOfLamps: "",
        contribution: "0.00",
        specialNote: "",
      });
      setSelectedBookingId("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit report." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 space-y-4 font-['Arimo',sans-serif]">
      <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Report Aarti</h2>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-bold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Reporting Senapati</label>
          <input
            type="text"
            readOnly
            value={profile?.name || ""}
            className="w-full px-3 py-2 border rounded-lg bg-slate-100 font-semibold text-slate-700 outline-none"
          />
        </div>

        <label className="flex items-center space-x-2 font-bold text-slate-800 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isOffline}
            onChange={(e) => {
              setIsOffline(e.target.checked);
              setSelectedBookingId("");
            }}
            className="rounded text-sky-600 h-4 w-4 cursor-pointer"
          />
          <span>Unregistered Host (Direct Offline Aarti)</span>
        </label>

        {!isOffline ? (
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Select Assigned Booking *
            </label>
            <select
              required
              value={selectedBookingId}
              onChange={(e) => handleBookingSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-sm cursor-pointer"
            >
              <option value="">-- Choose Host --</option>
              {assignedBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.full_name} ({b.city || b.emirate}) - {b.aarti_date} ({b.aarti_time})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Host Name *</label>
              <input
                type="text"
                name="hostName"
                required
                maxLength={FIELD_LIMITS.name}
                value={formData.hostName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Devotee / Host Name"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {formData.hostName.length}/{FIELD_LIMITS.name}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Host Mobile (05xxxxxxxx) *</label>
              <input
                type="tel"
                inputMode="numeric"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="0501234567"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {formData.mobile.length}/{FIELD_LIMITS.mobile}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Host Email *</label>
              <input
                type="email"
                name="email"
                required
                maxLength={FIELD_LIMITS.email}
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="host@example.com"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {formData.email.length}/{FIELD_LIMITS.email}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Residential Address *</label>
              <textarea
                rows={3}
                name="address"
                required
                maxLength={FIELD_LIMITS.address}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
                placeholder="Building, Flat, Street (commas allowed)"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {formData.address.length}/{FIELD_LIMITS.address}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  name="aartiDate"
                  required
                  min={KARTHIK_START_DATE}
                  max={KARTHIK_END_DATE}
                  value={formData.aartiDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                <select
                  name="aartiTime"
                  value={formData.aartiTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
                >
                  {FORM_CONTENT.timeSlots.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Lamps Offered *
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="noOfLamps"
              required
              maxLength={FIELD_LIMITS.noOfLamps}
              value={formData.noOfLamps}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g. 25"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.noOfLamps.length}/{FIELD_LIMITS.noOfLamps}
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Contribution (AED)
            </label>
            <input
              type="number"
              step="0.01"
              name="contribution"
              value={formData.contribution}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Special Notes</label>
          <textarea
            rows={3}
            name="specialNote"
            maxLength={FIELD_LIMITS.notes}
            value={formData.specialNote}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
            placeholder="Highlights, kirtan response, prasadam details..."
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.specialNote.length}/{FIELD_LIMITS.notes}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase mt-2 cursor-pointer"
        >
          {loading ? "Submitting..." : "SUBMIT AARTI REPORT"}
        </button>
      </form>
    </div>
  );
}