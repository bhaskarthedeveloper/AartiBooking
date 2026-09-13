"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/services/notificationService";
import { convertTo12Hour } from "@/lib/timeUtils";
import {
  CandidateSenapati,
  fetchPendingSenapatis,
  fetchApprovedSenapatis,
  fetchAartisByStatus,
  fetchConnectedDevotees,
  updateSenapatiStatus,
  assignDevoteeToEvent,
  findMatchingSenapatis,
  downloadBulkUploadTemplate,
  processBulkUpload,
} from "./adminService";

type AdminTab =
  | "senapati-requests"
  | "approved-senapatis"
  | "pending-arati"
  | "scheduled-arati"
  | "completed-arati"
  | "reassign-pending"
  | "connected-data"
  | "bulk-upload"
  | "email-preview"
  | "change-password";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("senapati-requests");
  const [loading, setLoading] = useState(true);

  const [senapatis, setSenapatis] = useState<any[]>([]);
  const [aratis, setAratis] = useState<any[]>([]);
  const [connectedData, setConnectedData] = useState<any[]>([]);

  // Assignment Modal & Matching Logic State
  const [assigningEvent, setAssigningEvent] = useState<any | null>(null);
  const [matchingDevotees, setMatchingDevotees] = useState<CandidateSenapati[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSenapati | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Test Email state
  const [testMailLoading, setTestMailLoading] = useState(false);
  const [testMailNotice, setTestMailNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    if (activeTab === "change-password" || activeTab === "bulk-upload" || activeTab === "email-preview") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "senapati-requests") {
        const data = await fetchPendingSenapatis();
        setSenapatis(data);
      } else if (activeTab === "approved-senapatis") {
        const data = await fetchApprovedSenapatis();
        setSenapatis(data);
      } else if (activeTab === "pending-arati") {
        const data = await fetchAartisByStatus("pending");
        setAratis(data);
      } else if (activeTab === "scheduled-arati") {
        const data = await fetchAartisByStatus("assigned");
        setAratis(data);
      } else if (activeTab === "completed-arati") {
        const data = await fetchAartisByStatus("completed");
        setAratis(data);
      } else if (activeTab === "reassign-pending") {
        const data = await fetchAartisByStatus("rejectbydevote");
        setAratis(data);
      } else if (activeTab === "connected-data") {
        const data = await fetchConnectedDevotees();
        setConnectedData(data);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSendTestMail = async (action: "test_mail" | "test_all_templates") => {
    setTestMailLoading(true);
    setTestMailNotice(null);

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch test email.");

      setTestMailNotice({
        type: "success",
        text:
          action === "test_all_templates"
            ? "Consolidated email digest sent successfully! Please check your inbox and spam folder."
            : "Single test verification email dispatched successfully! Please check your admin inbox.",
      });
    } catch (err: any) {
      setTestMailNotice({
        type: "error",
        text: err.message || "Failed to send test email.",
      });
    } finally {
      setTestMailLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await processBulkUpload(uploadFile);
      setUploadResult(result);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process bulk upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPwSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to update admin password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
    await updateSenapatiStatus(id, status);

    const senapatiRecord = senapatis.find((s) => s.id === id);
    if (senapatiRecord) {
      // Trigger approval/rejection notification to Devotee and Admin
      sendNotification("requestaction", {
        name: senapatiRecord.name,
        sanapatimail: senapatiRecord.mail,
        mobile: senapatiRecord.mobile,
        status: status === "approved" ? "Approved" : "Rejected",
        Reason: status === "rejected" ? "Application not approved by temple coordinator." : "",
      });
    }

    loadData();
  };

  const openAssignmentModal = async (event: any) => {
    setAssigningEvent(event);
    setSelectedCandidate(null);
    setMatchingLoading(true);

    try {
      const candidates = await findMatchingSenapatis(event);
      setMatchingDevotees(candidates);
    } catch (err) {
      console.error("Matching error:", err);
      setMatchingDevotees([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assigningEvent || !selectedCandidate) return;

    await assignDevoteeToEvent(assigningEvent.id, selectedCandidate);

    // Trigger allocation notification to Admin, Senapati, and Host
    sendNotification("allocation", {
      uname: assigningEvent.full_name,
      umail: assigningEvent.email,
      sanname: selectedCandidate.name,
      sanapatimail: selectedCandidate.mail,
      mobile: assigningEvent.mobile,
      date: assigningEvent.aarti_date,
      time: assigningEvent.aarti_time,
      address: assigningEvent.address,
      landmark: assigningEvent.landmark,
      area: assigningEvent.city,
      emirate: assigningEvent.emirate,
    });

    setAssigningEvent(null);
    setSelectedCandidate(null);
    loadData();
  };

  const exportToCSV = () => {
    let rows: any[] = [];
    if (activeTab.includes("senapati")) rows = senapatis;
    else if (activeTab === "connected-data") rows = connectedData;
    else rows = aratis;

    if (rows.length === 0) return alert("No data available to export.");

    const headers = Object.keys(rows[0]).join(",");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-xs font-['Arimo',sans-serif]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-60 bg-purple-950 text-white p-3 shrink-0 flex flex-col justify-between shadow-md">
        <div>
          <div className="font-extrabold text-sm border-b border-purple-800 pb-3 mb-3">
            Admin Portal
          </div>
          <nav className="space-y-1 font-semibold">
            {[
              { key: "senapati-requests", label: "Senapati Requests" },
              { key: "approved-senapatis", label: "Approved Senapatis" },
              { key: "pending-arati", label: "Pending Arati" },
              { key: "scheduled-arati", label: "Scheduled Arati" },
              { key: "completed-arati", label: "Completed Arati" },
              { key: "reassign-pending", label: "Re-assign Pending" },
              { key: "connected-data", label: "Get Connected Data" },
              { key: "bulk-upload", label: "Bulk Aarti Upload" },
              { key: "email-preview", label: "Email Content Preview" },
              { key: "change-password", label: "Change Password" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as AdminTab);
                  setPwError(null);
                  setPwSuccess(false);
                  setTestMailNotice(null);
                  setUploadError(null);
                  setUploadResult(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-sky-600 text-white font-bold shadow-xs"
                    : "hover:bg-purple-900/60 text-purple-200"
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
          className="mt-6 font-bold text-center border border-purple-800 p-2 rounded hover:bg-purple-900 text-rose-300 cursor-pointer"
        >
          Logout
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-x-auto">
        {activeTab !== "change-password" && activeTab !== "bulk-upload" && activeTab !== "email-preview" && (
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="font-bold uppercase tracking-wider text-slate-700">
              {activeTab.replace(/-/g, " ")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={testMailLoading}
                onClick={() => handleSendTestMail("test_mail")}
                className="bg-purple-900 hover:bg-purple-950 text-white px-3 py-1.5 rounded font-bold cursor-pointer transition disabled:opacity-50"
              >
                {testMailLoading ? "Sending Test Mail..." : "📧 Quick Test Mail"}
              </button>
              <button
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold cursor-pointer"
              >
                📥 Download CSV
              </button>
            </div>
          </div>
        )}

        {/* Test Email Status Banner */}
        {testMailNotice && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold mb-4 border ${
              testMailNotice.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {testMailNotice.text}
          </div>
        )}

        {/* TAB 1: BULK EXCEL UPLOAD */}
        {activeTab === "bulk-upload" ? (
          <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bulk Upload Completed Aartis</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload historical or offline completed Aarti reports in bulk via Excel (.xlsx).
              </p>
            </div>

            {/* Download Template Step */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-sky-900">Step 1: Download Official Excel Template</p>
                <p className="text-[11px] text-sky-700">
                  Headers and time window formats must remain exact to pass validation.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadBulkUploadTemplate}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded cursor-pointer transition shadow-2xs"
              >
                📥 Download Template
              </button>
            </div>

            {uploadResult && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg space-y-1">
                <p className="font-bold">✓ Successfully processed and inserted {uploadResult.inserted} completed Aartis!</p>
                {uploadResult.errors.length > 0 && (
                  <div className="text-[10px] text-amber-800 mt-1">
                    <p className="font-semibold">Skipped Rows / Format Warnings:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {uploadResult.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-xs whitespace-pre-line">
                {uploadError}
              </div>
            )}

            {/* Upload File Step */}
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Step 2: Select Completed Excel Sheet (.xlsx) *
                </label>
                <input
                  type="file"
                  required
                  accept=".xlsx, .xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border rounded px-3 py-2 bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {uploading ? "Validating & Inserting..." : "Upload & Process Excel"}
              </button>
            </form>
          </div>
        ) : activeTab === "email-preview" ? (
          /* TAB 2: EMAIL NOTIFICATION DIGEST TEST */
          <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Notification Template Testing</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Send yourself a comprehensive test email containing all 21 automated email templates compiled with sample data.
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
              <p className="font-bold text-purple-950 text-xs">Templates included in preview digest:</p>
              <ul className="list-disc pl-4 text-[11px] text-purple-800 space-y-0.5">
                <li>Host Booking confirmation & Sevadhari assignment emails[cite: 11]</li>
                <li>Senapati registration receipts and admin alert workflows[cite: 11]</li>
                <li>Completed Aarti reporting receipts & direct offline acknowledgments[cite: 11]</li>
                <li>Devotee allocation notices and cancellation/rejection fallbacks[cite: 11]</li>
                <li>Senapati approval & rejection notification letters[cite: 11]</li>
                <li>WhatsApp links, email compose triggers, and portal redirect paths[cite: 11]</li>
              </ul>
            </div>

            <button
              type="button"
              disabled={testMailLoading}
              onClick={() => handleSendTestMail("test_all_templates")}
              className="w-full py-3 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer text-xs"
            >
              {testMailLoading ? "Sending All Templates Digest..." : "📨 Send All Templates Digest to Admin Mail"}
            </button>
          </div>
        ) : activeTab === "change-password" ? (
          /* TAB 3: CHANGE PASSWORD */
          <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Admin Password</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Update your administrative login password. Must be at least 6 characters.
              </p>
            </div>

            {pwSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold">
                Admin password updated successfully!
              </div>
            )}

            {pwError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-semibold">
                {pwError}
              </div>
            )}

            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded px-3 py-2 bg-white text-xs outline-none focus:ring-2 focus:ring-purple-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Confirm Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border rounded px-3 py-2 bg-white text-xs outline-none focus:ring-2 focus:ring-purple-800"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 bg-purple-950 hover:bg-purple-900 text-white font-bold rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        ) : (
          /* TAB 4+: RECORD DATA TABLES */
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading records...</div>
            ) : activeTab === "senapati-requests" || activeTab === "approved-senapatis" ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Legal Name</th>
                    <th className="p-3">Initiated Name</th>
                    <th className="p-3">Spiritual Master</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">WhatsApp No.</th>
                    <th className="p-3">Area / Emirate</th>
                    {activeTab === "senapati-requests" && <th className="p-3">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {senapatis.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTab === "senapati-requests" ? 8 : 7}
                        className="p-6 text-center text-slate-400 italic"
                      >
                        No senapati records found.
                      </td>
                    </tr>
                  ) : (
                    senapatis.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3 text-slate-700">{s.init_name || "—"}</td>
                        <td className="p-3 text-slate-700">{s.init_spit_master || "—"}</td>
                        <td className="p-3 text-slate-600">{s.mail}</td>
                        <td className="p-3 font-mono">{s.mobile}</td>
                        <td className="p-3 font-mono">{s.wpnumber || s.whatsapp || "—"}</td>
                        <td className="p-3 text-slate-700">{s.area ? `${s.area}, ${s.city}` : s.city}</td>
                        {activeTab === "senapati-requests" && (
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleStatusChange(s.id, "approved")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.id, "rejected")}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeTab === "pending-arati" ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Host Name</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Date / Time</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">WhatsApp</th>
                    <th className="p-3">Assigned Devotee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aratis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        No pending bookings found.
                      </td>
                    </tr>
                  ) : (
                    aratis.map((a) => (
                      <tr key={a.id || a.token} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{a.full_name}</td>
                        <td className="p-3 text-slate-600">
                          {a.address}, {a.city || a.emirate}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {a.aarti_date} ({a.aarti_time})
                        </td>
                        <td className="p-3 font-mono">{a.mobile}</td>
                        <td className="p-3 font-mono">{a.whatsapp_no || "—"}</td>
                        <td className="p-3">
                          {a.devotee_name ? (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              {a.devotee_name}
                            </span>
                          ) : (
                            <button
                              onClick={() => openAssignmentModal(a)}
                              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded font-bold transition cursor-pointer shadow-2xs"
                            >
                              Assign Devotee
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeTab === "connected-data" ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Emirate</th>
                    <th className="p-3">Seva Interest</th>
                    <th className="p-3">Liked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {connectedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        No connected devotee responses yet.
                      </td>
                    </tr>
                  ) : (
                    connectedData.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold">{c.name}</td>
                        <td className="p-3 font-mono">{c.mobile}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.emirate}</td>
                        <td className="p-3">{c.seva_interested}</td>
                        <td className="p-3">{c.liked}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Host Name</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Date / Time</th>
                    <th className="p-3">Assigned Devotee</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aratis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        No bookings found in this category.
                      </td>
                    </tr>
                  ) : (
                    aratis.map((a) => (
                      <tr key={a.id || a.token} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{a.full_name}</td>
                        <td className="p-3 text-slate-600">
                          {a.address}, {a.city || a.emirate}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {a.aarti_date} ({a.aarti_time})
                        </td>
                        <td className="p-3 text-sky-800 font-semibold">{a.devotee_name || "Unassigned"}</td>
                        <td className="p-3 font-bold uppercase">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              a.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : a.status === "rejectbydevote"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {(a.status === "rejectbydevote" || a.status === "assigned") && (
                            <button
                              onClick={() => openAssignmentModal(a)}
                              className={`px-3 py-1 rounded font-bold cursor-pointer transition shadow-2xs ${
                                a.status === "rejectbydevote"
                                  ? "bg-rose-700 hover:bg-rose-800 text-white"
                                  : "text-slate-500 hover:text-sky-700 underline"
                              }`}
                            >
                              Re-assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 1-Hour Conflict Matching Modal */}
        {assigningEvent && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-lg w-full p-5 rounded-xl border space-y-4 shadow-xl">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Devotee for {assigningEvent.full_name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target Date: <strong>{assigningEvent.aarti_date}</strong> | Slot:{" "}
                  <strong>{assigningEvent.aarti_time}</strong> | Emirate:{" "}
                  <strong>{assigningEvent.emirate}</strong>
                </p>
              </div>

              {matchingLoading ? (
                <div className="py-8 text-center text-slate-500 font-medium">
                  Checking matching schedules and conflict status...
                </div>
              ) : matchingDevotees.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                  <p className="font-bold">No Conflict-Free Senapatis Available</p>
                  <p className="text-[11px]">
                    No approved devotees have recorded availability covering this date and time window in{" "}
                    <strong>{assigningEvent.emirate}</strong>, or all matching devotees currently have conflicting bookings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block font-bold text-slate-700 uppercase">
                    Eligible & Available Senapatis ({matchingDevotees.length})
                  </label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                    {matchingDevotees.map((sen) => (
                      <label
                        key={sen.senapati_id}
                        className={`flex items-center justify-between p-2.5 rounded cursor-pointer border transition ${
                          selectedCandidate?.senapati_id === sen.senapati_id
                            ? "bg-sky-50 border-sky-600"
                            : "bg-white border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="radio"
                            name="devoteeSelection"
                            value={sen.senapati_id}
                            checked={selectedCandidate?.senapati_id === sen.senapati_id}
                            onChange={() => setSelectedCandidate(sen)}
                            className="text-sky-600 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{sen.name}</span>
                            <span className="text-slate-500 text-[10px] block">
                              Emirate: {sen.emirate} {sen.area ? `(${sen.area})` : ""} | Available: {convertTo12Hour(sen.start_time)} to {convertTo12Hour(sen.end_time)}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssigningEvent(null);
                    setSelectedCandidate(null);
                  }}
                  className="px-3 py-1.5 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedCandidate}
                  onClick={handleConfirmAssignment}
                  className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}