"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SenapatiReportTab from "@/components/forms/SenapatiReportTab";
import SenapatiAvailabilityTab from "@/components/forms/SenapatiAvailabilityTab";
import {
  AvailabilitySlot,
  fetchCurrentSenapatiProfile,
  fetchSenapatiEvents,
  fetchSenapatiAvailabilitySlots,
  rejectAartiEvent,
  updateSenapatiPassword,
} from "./senapatiService";
import { sendNotification } from "@/services/notificationService";

type SenapatiTab =
  | "pending"
  | "completed"
  | "rejected"
  | "availability"
  | "report"
  | "password";

export default function SenapatiDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<SenapatiTab>("pending");
  const [events, setEvents] = useState<any[]>([]);
  const [slotsList, setSlotsList] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectingEvent, setRejectingEvent] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Silent refresh for slots without blanking the whole UI
  const refreshSlotsOnly = async () => {
    if (!profile?.id) return;
    try {
      const slots = await fetchSenapatiAvailabilitySlots(profile.id);
      setSlotsList(slots);
    } catch (err) {
      console.error("Failed to refresh slots:", err);
    }
  };

  const loadDashboardData = async (showFullLoading = true) => {
    if (showFullLoading) setLoading(true);

    try {
      let currentProfile = profile;
      if (!currentProfile) {
        currentProfile = await fetchCurrentSenapatiProfile();
        setProfile(currentProfile);
      }

      if (currentProfile?.id && activeTab !== "password") {
        let statusFilter: "assigned" | "completed" | "rejectbydevote" =
          "assigned";
        if (activeTab === "completed") statusFilter = "completed";
        if (activeTab === "rejected") statusFilter = "rejectbydevote";

        const evts = await fetchSenapatiEvents(currentProfile.id, statusFilter);
        setEvents(evts);

        const slots = await fetchSenapatiAvailabilitySlots(currentProfile.id);
        setSlotsList(slots);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      if (showFullLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);
  }, [activeTab]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await updateSenapatiPassword(newPassword);
      setPwSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingEvent || !rejectReason.trim()) return;

    try {
      await rejectAartiEvent(
        rejectingEvent.id,
        profile?.name || "Devotee",
        rejectReason,
      );
      sendNotification("reasign", {
        sanname: profile?.name || "Devotee",
        Host: rejectingEvent.full_name,
        hostmail: rejectingEvent.email,
        mobile: rejectingEvent.mobile,
        sanapatimail: profile?.mail,
        date: rejectingEvent.aarti_date,
        time: rejectingEvent.aarti_time,
        address: `${rejectingEvent.address}, ${rejectingEvent.city || ""}`,
        Reason: rejectReason.trim(),
      });
      setRejectingEvent(null);
      setRejectReason("");
      loadDashboardData(false);
    } catch (err: any) {
      alert(err.message || "Failed to reject Aarti booking.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-xs font-['Arimo',sans-serif]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 bg-[rgb(23,91,126)] text-white p-4 shrink-0 flex flex-col justify-between shadow-md">
        <div>
          <div className="border-b border-cyan-700/50 pb-3 mb-4">
            <h1 className="text-sm font-extrabold tracking-wide">
              Senapati Portal
            </h1>
            <p className="text-[11px] text-cyan-200 mt-0.5">
              Hare Krishna, {profile?.name || "Devotee"}
            </p>
          </div>

          <nav className="space-y-1 font-semibold">
            {[
              { key: "pending", label: "Pending Arati" },
              { key: "completed", label: "Completed Arati" },
              { key: "rejected", label: "Rejected Arati" },
              { key: "availability", label: "Date & Slot Availability" },
              { key: "report", label: "Report Arati" },
              { key: "password", label: "Change Password" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as SenapatiTab);
                  setPwError(null);
                  setPwSuccess(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-white text-[rgb(23,91,126)] font-bold shadow-xs"
                    : "hover:bg-cyan-800/60 text-cyan-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="mt-6 font-bold border border-cyan-700 p-2 rounded hover:bg-cyan-800/80 text-rose-200 text-center cursor-pointer"
        >
          Sign Out
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">
            Loading records...
          </div>
        ) : activeTab === "password" ? (
          <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Change Your Password
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Update your login password. Must be at least 6 characters.
              </p>
            </div>

            {pwSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold">
                Password updated successfully!
              </div>
            )}

            {pwError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-semibold">
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded px-3 py-2 bg-white text-xs outline-none focus:ring-2 focus:ring-[rgb(23,91,126)]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded px-3 py-2 bg-white text-xs outline-none focus:ring-2 focus:ring-[rgb(23,91,126)]"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 bg-[rgb(23,91,126)] hover:bg-[rgb(18,74,103)] text-white font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        ) : activeTab === "report" ? (
          <SenapatiReportTab
            profile={profile}
            onSuccess={() => loadDashboardData(false)}
          />
        ) : activeTab === "availability" ? (
          <SenapatiAvailabilityTab
            profile={profile}
            slotsList={slotsList}
            onSlotsUpdated={refreshSlotsOnly}
          />
        ) : (
          /* Bookings Tab (Pending / Completed / Rejected) */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                <tr>
                  <th className="p-3">Host Name</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Booking Date</th>
                  <th className="p-3">Time Window</th>
                  <th className="p-3">Mobile No.</th>
                  <th className="p-3">
                    {activeTab === "pending" ? "Action" : "Reg. Mode"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 italic"
                    >
                      No records found in this category.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {e.full_name}
                      </td>
                      <td className="p-3 text-slate-600">
                        {e.address}, {e.city}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {e.aarti_date}
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {e.aarti_time}
                      </td>
                      <td className="p-3 font-mono">{e.mobile}</td>
                      <td className="p-3">
                        {activeTab === "pending" ? (
                          <button
                            onClick={() => setRejectingEvent(e)}
                            className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {e.registration_mode}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject Modal */}
        {rejectingEvent && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-sm w-full p-6 rounded-xl border space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900">
                Reason for Rejecting Aarti
              </h3>
              <p className="text-[11px] text-slate-500">
                Please enter a reason so coordinators can reassign this Aarti to
                another devotee.
              </p>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify reason..."
                className="w-full border rounded p-2 text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingEvent(null);
                    setRejectReason("");
                  }}
                  className="px-3 py-1.5 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectReason.trim()}
                  onClick={handleConfirmReject}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded font-bold disabled:opacity-50 cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
