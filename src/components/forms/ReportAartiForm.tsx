"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { FORM_CONTENT, KARTHIK_START_DATE, KARTHIK_END_DATE } from "@/lib/constants";
import FormPageLayout from "@/components/forms/FormPageLayout";
import {
  FIELD_LIMITS,
  validateFullName,
  validateEmail,
  validateUAEMobile,
  validateAddress,
} from "@/lib/validation";

export default function ReportAartiForm() {
  const [loading, setLoading] = useState(false);
  const [verifiedSenapati, setVerifiedSenapati] = useState<{ id: string; name: string } | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [assignedBookings, setAssignedBookings] = useState<any[]>([]);

  const [isUnregisteredHost, setIsUnregisteredHost] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [reportData, setReportData] = useState({
    hostName: "",
    mobile: "05",
    email: "",
    address: "",
    emirate: "Dubai",
    city: "",
    aartiDate: KARTHIK_START_DATE,
    aartiTime: FORM_CONTENT.timeSlots[0] || "08:00 AM - 09:00 AM",
    noOfLamps: "",
    contribution: "0.00",
    specialNote: "",
  });

  const handleVerifySenapati = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setMessage(null);

    const cleanInput = verificationInput.trim();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, name, status, mobile, mail")
      .or(`mobile.eq.${cleanInput},mail.eq.${cleanInput}`)
      .eq("status", "approved")
      .maybeSingle();

    if (error || !profile) {
      setMessage({ type: "error", text: "Approved Senapati record not found for this mobile/email." });
      setIsVerifying(false);
      return;
    }

    setVerifiedSenapati({ id: profile.id, name: profile.name });

    const { data: bookings } = await supabase
      .from("aarti_events")
      .select("*")
      .eq("assigned_sevadhari_id", profile.id)
      .eq("status", "assigned")
      .order("aarti_date", { ascending: true });

    setAssignedBookings(bookings || []);
    setIsVerifying(false);
  };

  const handleBookingSelect = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    const selected = assignedBookings.find((b) => b.id === bookingId);
    if (selected) {
      setReportData((prev) => ({
        ...prev,
        hostName: selected.full_name,
        mobile: selected.mobile,
        email: selected.email,
        address: selected.address,
        emirate: selected.emirate,
        city: selected.city || "",
        aartiDate: selected.aarti_date,
        aartiTime: selected.aarti_time, // Unified column
      }));
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.startsWith("05")) {
      digitsOnly = digitsOnly.slice(2);
    }
    digitsOnly = digitsOnly.slice(0, FIELD_LIMITS.mobileDigitsAfterPrefix);
    setReportData((prev) => ({ ...prev, mobile: `05${digitsOnly}` }));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isUnregisteredHost) {
      const nameErr = validateFullName(reportData.hostName);
      const emailErr = validateEmail(reportData.email);
      const mobileErr = validateUAEMobile(reportData.mobile);
      const addrErr = validateAddress(reportData.address);

      if (nameErr || emailErr || mobileErr || addrErr) {
        setMessage({ type: "error", text: nameErr || emailErr || mobileErr || addrErr || "Validation error" });
        setLoading(false);
        return;
      }
    }

    try {
      if (isUnregisteredHost) {
        const generatedToken = `DIR-${Math.floor(100000 + Math.random() * 900000)}`;
        const datewiseInt = parseInt(reportData.aartiDate.replace(/-/g, ""), 10);

        const { error } = await supabase.from("aarti_events").insert([
          {
            assigned_sevadhari_id: verifiedSenapati?.id,
            devotee_name: verifiedSenapati?.name,
            full_name: reportData.hostName.trim(),
            mobile: reportData.mobile.trim(),
            email: reportData.email.trim(),
            emirate: reportData.emirate,
            city: reportData.city.trim(),
            address: reportData.address.trim(),
            aarti_date: reportData.aartiDate,
            aarti_time: reportData.aartiTime,
            token: generatedToken,
            datewise: datewiseInt,
            no_of_lamps: reportData.noOfLamps.trim(),
            contribution: parseFloat(reportData.contribution) || 0.0,
            special_note: reportData.specialNote.trim(),
            status: "completed",
            registration_mode: "direct_sevadhari_report",
          },
        ]);
        if (error) throw error;
      } else {
        if (!selectedBookingId) {
          throw new Error("Please select an assigned booking to report.");
        }

        const { error } = await supabase
          .from("aarti_events")
          .update({
            no_of_lamps: reportData.noOfLamps.trim(),
            contribution: parseFloat(reportData.contribution) || 0.0,
            special_note: reportData.specialNote.trim(),
            status: "completed",
          })
          .eq("id", selectedBookingId);
        if (error) throw error;
      }

      setMessage({ type: "success", text: "Aarti reported successfully! Hare Krishna." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit Aarti report." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout>
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {FORM_CONTENT.reportAarti.heading}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {FORM_CONTENT.reportAarti.subheading}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold mb-4 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {!verifiedSenapati ? (
        <form onSubmit={handleVerifySenapati} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Senapati Identifier (Mobile or Email) *
            </label>
            <input
              type="text"
              required
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              placeholder="e.g. 0501234567 or devotee@example.com"
              className="w-full px-3 py-3 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase cursor-pointer"
          >
            {isVerifying ? "Verifying..." : FORM_CONTENT.reportAarti.verifyButtonText}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center text-xs">
            <span>Senapati: <strong className="text-slate-900">{verifiedSenapati.name}</strong></span>
            <button
              type="button"
              onClick={() => {
                setVerifiedSenapati(null);
                setSelectedBookingId("");
              }}
              className="text-sky-700 underline font-bold cursor-pointer"
            >
              Change
            </button>
          </div>

          <label className="flex items-center space-x-2 text-slate-700 font-bold border-b pb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isUnregisteredHost}
              onChange={(e) => setIsUnregisteredHost(e.target.checked)}
              className="rounded text-sky-600 h-4 w-4 cursor-pointer"
            />
            <span>Unregistered Host (Direct Offline Aarti)</span>
          </label>

          {!isUnregisteredHost ? (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Select Assigned Booking *
              </label>
              <select
                required
                value={selectedBookingId}
                onChange={(e) => handleBookingSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
              >
                <option value="">-- Choose Assigned Booking --</option>
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Host Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.name}
                  value={reportData.hostName}
                  onChange={(e) => setReportData({ ...reportData, hostName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Host Full Name"
                />
                <div className="text-right text-[11px] text-slate-500 mt-1">
                  {reportData.hostName.length}/{FIELD_LIMITS.name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Host Mobile (05xxxxxxxx) *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={reportData.mobile}
                  onChange={handleMobileChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="0501234567"
                />
                <div className="text-right text-[11px] text-slate-500 mt-1">
                  {reportData.mobile.length}/{FIELD_LIMITS.mobile}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Host Email *</label>
                <input
                  type="email"
                  required
                  maxLength={FIELD_LIMITS.email}
                  value={reportData.email}
                  onChange={(e) => setReportData({ ...reportData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="name@example.com"
                />
                <div className="text-right text-[11px] text-slate-500 mt-1">
                  {reportData.email.length}/{FIELD_LIMITS.email}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Residential Address *</label>
                <textarea
                  rows={3}
                  required
                  maxLength={FIELD_LIMITS.address}
                  value={reportData.address}
                  onChange={(e) => setReportData({ ...reportData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
                  placeholder="Building, Flat, Street"
                />
                <div className="text-right text-[11px] text-slate-500 mt-1">
                  {reportData.address.length}/{FIELD_LIMITS.address}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Emirate *</label>
                  <select
                    name="emirate"
                    value={reportData.emirate}
                    onChange={(e) => setReportData({ ...reportData, emirate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
                  >
                    {FORM_CONTENT.emirates.map((em) => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Area / Locality *</label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.city}
                    value={reportData.city}
                    onChange={(e) => setReportData({ ...reportData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Bur Dubai"
                  />
                  <div className="text-right text-[11px] text-slate-500 mt-1">
                    {reportData.city.length}/{FIELD_LIMITS.city}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Aarti Date *</label>
                  <input
                    type="date"
                    required
                    min={KARTHIK_START_DATE}
                    max={KARTHIK_END_DATE}
                    value={reportData.aartiDate}
                    onChange={(e) => setReportData({ ...reportData, aartiDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                  <select
                    value={reportData.aartiTime}
                    onChange={(e) => setReportData({ ...reportData, aartiTime: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Lamps Offered *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={FIELD_LIMITS.noOfLamps}
                value={reportData.noOfLamps}
                onChange={(e) => setReportData({ ...reportData, noOfLamps: e.target.value.replace(/\D/g, "") })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g. 25"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {reportData.noOfLamps.length}/{FIELD_LIMITS.noOfLamps}
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Contribution (AED)</label>
              <input
                type="number"
                step="0.01"
                value={reportData.contribution}
                onChange={(e) => setReportData({ ...reportData, contribution: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Special Notes</label>
            <textarea
              rows={3}
              maxLength={FIELD_LIMITS.notes}
              value={reportData.specialNote}
              onChange={(e) => setReportData({ ...reportData, specialNote: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
              placeholder="Highlights, devotee enthusiasm, prasadam distribution..."
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {reportData.specialNote.length}/{FIELD_LIMITS.notes}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase mt-4 cursor-pointer"
          >
            {loading ? "Submitting..." : FORM_CONTENT.reportAarti.submitButtonText}
          </button>
        </form>
      )}
    </FormPageLayout>
  );
}