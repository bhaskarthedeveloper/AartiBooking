"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FORM_CONTENT,
  KARTHIK_START_DATE,
  KARTHIK_END_DATE,
} from "@/lib/constants";
import FormPageLayout from "@/components/forms/FormPageLayout";
import {
  sanitizeTextOnly,
  sanitizeAlphaOnly,
  sanitizeAddress,
  FIELD_LIMITS,
  validateFullName,
  validateEmail,
  validateUAEMobile,
  validateWhatsapp,
  validateAddress,
} from "@/lib/validation";
import { sendNotification } from "@/services/notificationService";

export default function BookAartiForm() {
  const [loading, setLoading] = useState(false);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "05",
    whatsappNo: "+",
    emirate: "Dubai",
    city: "",
    address: "",
    landmark: "",
    aartiDate: KARTHIK_START_DATE,
    aartiTime: FORM_CONTENT.timeSlots[0],
    expectedAudience: "0-15",
    firstTime: false,
    flexibleDateTime: false,
    company: "",
    profession: "",
    selectedLanguages: [] as string[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (name === "fullName") {
      setFormData((prev) => ({
        ...prev,
        fullName: sanitizeAlphaOnly(value).slice(0, FIELD_LIMITS.name),
      }));
      return;
    }

    if (name === "address") {
      setFormData((prev) => ({
        ...prev,
        address: sanitizeAddress(value).slice(0, FIELD_LIMITS.address),
      }));
      return;
    }

    if (["city", "landmark", "company", "profession"].includes(name)) {
      const limit = (FIELD_LIMITS as any)[name] || 100;
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizeTextOnly(value).slice(0, limit),
      }));
      return;
    }

    if (name === "mobile") {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("05")) digits = digits.slice(2);
      setFormData((prev) => ({
        ...prev,
        mobile: `05${digits.slice(0, FIELD_LIMITS.mobileDigitsAfterPrefix)}`,
      }));
      return;
    }

    if (name === "whatsappNo") {
      const digits = value
        .replace(/[^\d]/g, "")
        .slice(0, FIELD_LIMITS.whatsapp);
      setFormData((prev) => ({ ...prev, whatsappNo: `+${digits}` }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const nameErr = validateFullName(formData.fullName);
    const emailErr = validateEmail(formData.email);
    const mobileErr = validateUAEMobile(formData.mobile);
    const waErr = validateWhatsapp(formData.whatsappNo);
    const addrErr = validateAddress(formData.address);

    if (nameErr || emailErr || mobileErr || waErr || addrErr) {
      setErrorMsg(nameErr || emailErr || mobileErr || waErr || addrErr);
      setLoading(false);
      return;
    }

    if (!formData.aartiDate) {
      setErrorMsg("Please select an Aarti date.");
      setLoading(false);
      return;
    }

    if (formData.selectedLanguages.length === 0) {
      setErrorMsg("Please select at least one preferred language.");
      setLoading(false);
      return;
    }

    const generatedToken = `ART-${Math.floor(100000 + Math.random() * 900000)}`;
    const datewiseInt = parseInt(formData.aartiDate.replace(/-/g, ""), 10);

    const payload = {
      full_name: formData.fullName.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      whatsapp_no: formData.whatsappNo.trim(),
      emirate: formData.emirate,
      city: formData.city.trim(),
      address: formData.address.trim(),
      landmark: formData.landmark.trim(),
      language: formData.selectedLanguages.join(", "),
      profession: formData.profession.trim(),
      company: formData.company.trim(),
      expected_audience: formData.expectedAudience,
      first_time: formData.firstTime,
      aarti_date: formData.aartiDate,
      aarti_time: formData.aartiTime, // Unified source of truth
      token: generatedToken,
      datewise: datewiseInt,
      status: "pending",
      registration_mode: "website_booking",
      contribution: 0.0,
      special_note: formData.flexibleDateTime
        ? "Flexible with date and time"
        : "",
    };

    try {
      const { error } = await supabase.from("aarti_events").insert([payload]);
      if (error) throw error;
      sendNotification("book_aarti", {
        hostname: payload.full_name,
        hostmail: payload.email,
        mobile: payload.mobile,
        emirate: payload.emirate,
        area: payload.city,
        landmark: payload.landmark,
        address: payload.address,
        date: payload.aarti_date,
        time: payload.aarti_time,
        token: generatedToken,
      });
      setSubmittedToken(generatedToken);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while booking Aarti.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedToken) {
    return (
      <div className="min-h-[calc(100vh-112px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Arati Booked Successfully
          </h2>
          <p className="text-xs text-slate-600">
            Hare Krishna! Your booking request has been registered. Our temple
            coordinator will assign a Sevadhari and reach out to you.
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs font-mono font-bold text-sky-800">
            Booking Token: {submittedToken}
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#84C341] hover:bg-[#77B336] text-white font-bold rounded-lg text-xs transition shadow-sm uppercase"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const whatsappDigitCount = formData.whatsappNo.startsWith("+")
    ? formData.whatsappNo.slice(1).length
    : formData.whatsappNo.length;

  return (
    <FormPageLayout>
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {FORM_CONTENT.bookAarti.heading}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {FORM_CONTENT.bookAarti.subheading}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            required
            maxLength={FIELD_LIMITS.name}
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Your Full Name"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.fullName.length}/{FIELD_LIMITS.name}
          </div>
        </div>

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
              onChange={handleInputChange}
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
              name="whatsappNo"
              required
              value={formData.whatsappNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="+971501234567"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {whatsappDigitCount}/{FIELD_LIMITS.whatsapp}
            </div>
          </div>
        </div>

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
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="name@example.com"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.email.length}/{FIELD_LIMITS.email}
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Physical Address *
          </label>
          <textarea
            rows={3}
            name="address"
            required
            maxLength={FIELD_LIMITS.address}
            value={formData.address}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
            placeholder="Flat/Villa No, Building Name, Street"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.address.length}/{FIELD_LIMITS.address}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Emirate *
            </label>
            <select
              name="emirate"
              value={formData.emirate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
            >
              {FORM_CONTENT.emirates.map((e) => (
                <option key={e} value={e}>
                  {e}
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
              name="city"
              required
              maxLength={FIELD_LIMITS.city}
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="e.g. Bur Dubai, Al Nahda"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.city.length}/{FIELD_LIMITS.city}
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Landmark *
          </label>
          <input
            type="text"
            name="landmark"
            required
            maxLength={FIELD_LIMITS.landmark}
            value={formData.landmark}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Nearby Metro, Supermarket, Park, etc."
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.landmark.length}/{FIELD_LIMITS.landmark}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Arati Date *
            </label>
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
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Time Slot *
            </label>
            <select
              name="aartiTime"
              value={formData.aartiTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
            >
              {FORM_CONTENT.timeSlots.map((ts) => (
                <option key={ts} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center space-x-2 text-slate-700 font-medium pt-1 cursor-pointer">
          <input
            type="checkbox"
            name="flexibleDateTime"
            checked={formData.flexibleDateTime}
            onChange={handleInputChange}
            className="rounded text-sky-600 h-4 w-4 cursor-pointer"
          />
          <span>Are you flexible with date and time?</span>
        </label>

        <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            name="firstTime"
            checked={formData.firstTime}
            onChange={handleInputChange}
            className="rounded text-sky-600 h-4 w-4 cursor-pointer"
          />
          <span>First time hosting an Aarti?</span>
        </label>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Expected Audience *
          </label>
          <select
            name="expectedAudience"
            value={formData.expectedAudience}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
          >
            {["0-15", "16-30", "31-50", "50+"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-2">
            Preferred Language(s) *
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="company"
              maxLength={FIELD_LIMITS.company}
              value={formData.company}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Employer / Company"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.company.length}/{FIELD_LIMITS.company}
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Known Local Reference
            </label>
            <input
              type="text"
              name="profession"
              maxLength={FIELD_LIMITS.profession}
              value={formData.profession}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Devotee or Friend Name"
            />
            <div className="text-right text-[11px] text-slate-500 mt-1">
              {formData.profession.length}/{FIELD_LIMITS.profession}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase mt-4 cursor-pointer"
        >
          {loading ? "Submitting..." : FORM_CONTENT.bookAarti.buttonText}
        </button>
      </form>
    </FormPageLayout>
  );
}
