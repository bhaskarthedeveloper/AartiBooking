"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FORM_CONTENT, AUTH_CONTENT } from "@/lib/constants";
import FormPageLayout from "@/components/forms/FormPageLayout";
import {
  FIELD_LIMITS,
  validateFullName,
  validateEmail,
  validateUAEMobile,
  validateWhatsapp,
  sanitizeAlphaOnly,
  sanitizeTextOnly,
} from "@/lib/validation";
import { sendNotification } from "@/services/notificationService";

export default function SenapatiRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    legalName: "",
    initiatedName: "",
    spiritualMaster: "",
    email: "",
    mobile: "05",
    whatsapp: "+",
    emirate: "Dubai",
    area: "",
    password: "",
    confirmPassword: "",
    selectedLanguages: ["English", "Hindi"],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Legal Name: Letters and spaces only
    if (name === "legalName") {
      setFormData((prev) => ({
        ...prev,
        legalName: sanitizeAlphaOnly(value).slice(0, FIELD_LIMITS.name),
      }));
      return;
    }

    // Initiated Name & Spiritual Master: Letters and spaces only
    if (name === "initiatedName" || name === "spiritualMaster") {
      const limit = name === "initiatedName" ? FIELD_LIMITS.name : 50;
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizeAlphaOnly(value).slice(0, limit),
      }));
      return;
    }

    // Area / Locality: Letters, numbers, and spaces only (no special characters)
    if (name === "area") {
      setFormData((prev) => ({
        ...prev,
        area: sanitizeTextOnly(value).slice(0, FIELD_LIMITS.city),
      }));
      return;
    }

    // Mobile: Permanent '05' prefix, numeric only, max 8 digits after '05'
    if (name === "mobile") {
      let digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.startsWith("05")) {
        digitsOnly = digitsOnly.slice(2);
      }
      digitsOnly = digitsOnly.slice(0, FIELD_LIMITS.mobileDigitsAfterPrefix);
      setFormData((prev) => ({ ...prev, mobile: `05${digitsOnly}` }));
      return;
    }

    // WhatsApp: Permanent '+' prefix, numeric only, max 12 digits after '+'
    if (name === "whatsapp") {
      const digitsOnly = value
        .replace(/[^\d]/g, "")
        .slice(0, FIELD_LIMITS.whatsapp);
      setFormData((prev) => ({ ...prev, whatsapp: `+${digitsOnly}` }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.selectedLanguages.includes(lang);
      return {
        ...prev,
        selectedLanguages: exists
          ? prev.selectedLanguages.filter((l) => l !== lang)
          : [...prev.selectedLanguages, lang],
      };
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const nameErr = validateFullName(formData.legalName);
    const emailErr = validateEmail(formData.email);
    const mobileErr = validateUAEMobile(formData.mobile);
    const waErr = validateWhatsapp(formData.whatsapp);

    if (nameErr || emailErr || mobileErr || waErr) {
      setErrorMsg(nameErr || emailErr || mobileErr || waErr);
      setLoading(false);
      return;
    }

    if (!formData.area.trim()) {
      setErrorMsg("Area / Locality is required.");
      setLoading(false);
      return;
    }

    if (formData.selectedLanguages.length === 0) {
      setErrorMsg("Please select at least one communication language.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user with explicit role and status metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.legalName.trim(),
            init_name: formData.initiatedName.trim() || null,
            init_spit_master: formData.spiritualMaster.trim() || null,
            mobile: formData.mobile.trim(),
            wpnumber: formData.whatsapp.trim(),
            city: formData.emirate,
            area: formData.area.trim(),
            language: formData.selectedLanguages.join(", "),
            role: "senapati", // Explicitly set role
            status: "pending_approval", // Explicitly set status
          },
        },
      });

      if (authError) throw authError;
      sendNotification("new_user", {
        sanname: formData.legalName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        whatsapp: formData.whatsapp.trim(),
        area: formData.area.trim(),
        emirate: formData.emirate,
      });
      // 2. Direct upsert fallback if a trigger does not exist on auth.users
      if (authData.user) {
        await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            name: formData.legalName.trim(),
            init_name: formData.initiatedName.trim() || null,
            init_spit_master: formData.spiritualMaster.trim() || null,
            mail: formData.email.trim(),
            mobile: formData.mobile.trim(),
            wpnumber: formData.whatsapp.trim(),
            city: formData.emirate,
            area: formData.area.trim(),
            language: formData.selectedLanguages.join(", "),
            role: "senapati",
            status: "pending_approval",
          },
          { onConflict: "id" },
        );
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-112px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Registration Submitted
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hare Krishna! Your registration as a Damodara Senapati has been
            received[cite: 13]. Once approved by the temple administrator, you
            will be able to log in to update availability and report
            Aartis[cite: 13].
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-[#84C341] hover:bg-[#77B336] text-white font-bold rounded-lg text-xs transition shadow-sm uppercase cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const whatsappDigitCount = formData.whatsapp.startsWith("+")
    ? formData.whatsapp.slice(1).length
    : formData.whatsapp.length;

  return (
    <FormPageLayout>
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {AUTH_CONTENT.loginHeading
            ? "Senapati Devotee Registration"
            : "Devotee Registration"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Register to serve as a Senapati devotee during the auspicious Karthika
          month[cite: 13].
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 text-xs">
        {/* Legal / Full Name */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Legal / Full Name *
          </label>
          <input
            type="text"
            name="legalName"
            required
            maxLength={FIELD_LIMITS.name}
            value={formData.legalName}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="e.g. Ramesh Kumar"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.legalName.length}/{FIELD_LIMITS.name}
          </div>
        </div>

        {/* Initiated Name & Spiritual Master Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Initiated Name (Optional)
            </label>
            <input
              type="text"
              name="initiatedName"
              maxLength={FIELD_LIMITS.name}
              value={formData.initiatedName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g. Radheshyam Das"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.initiatedName.length}/{FIELD_LIMITS.name}
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Spiritual Master (Optional)
            </label>
            <input
              type="text"
              name="spiritualMaster"
              maxLength={50}
              value={formData.spiritualMaster}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g. HH Jayapataka Swami"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.spiritualMaster.length}/50
            </div>
          </div>
        </div>

        {/* Mobile & WhatsApp Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Mobile Number (05xxxxxxxx) *
            </label>
            <input
              type="tel"
              inputMode="numeric"
              name="mobile"
              required
              value={formData.mobile}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="0501234567"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.mobile.length}/{FIELD_LIMITS.mobile}
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              WhatsApp Number *
            </label>
            <input
              type="tel"
              inputMode="tel"
              name="whatsapp"
              required
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="+971501234567"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {whatsappDigitCount}/{FIELD_LIMITS.whatsapp}
            </div>
          </div>
        </div>

        {/* Email Address - Full width vertical placement */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            maxLength={FIELD_LIMITS.email}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="name@example.com"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.email.length}/{FIELD_LIMITS.email}
          </div>
        </div>

        {/* Emirate & Area / Locality Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Emirate *
            </label>
            <select
              name="emirate"
              value={formData.emirate}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
            >
              {FORM_CONTENT.emirates.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Area / Locality *
            </label>
            <input
              type="text"
              name="area"
              required
              maxLength={FIELD_LIMITS.city}
              value={formData.area}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g. Al Nahda, Bur Dubai"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.area.length}/{FIELD_LIMITS.city}
            </div>
          </div>
        </div>

        {/* Communication Languages */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-2">
            Communication Languages *
          </label>
          <div className="flex flex-wrap gap-2">
            {FORM_CONTENT.languages.map((lang) => {
              const isSelected = formData.selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageToggle(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    isSelected
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lang} {isSelected ? "✓" : "+"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Password Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Create Password (min 6 chars) *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              maxLength={40}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="••••••••"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.password.length}/40
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              maxLength={40}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="••••••••"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.confirmPassword.length}/40
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase mt-4 cursor-pointer"
        >
          {loading ? "Registering..." : "Submit Registration"}
        </button>
      </form>
    </FormPageLayout>
  );
}
