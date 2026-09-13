"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { FORM_CONTENT } from "@/lib/constants";
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

export default function GetConnectedPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "05",
    whatsapp: "+",
    email: "",
    emirate: "Dubai",
    address: "",
    liked: "",
    interestedInSeva: false,
    sevaInterest: FORM_CONTENT.sevaOptions[0],
    otherInterestText: "",
    subscribeUpdates: false,
    attendedDetail: "",
  });

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value, type } = e.target;

  if (name === "name") {
    setFormData((prev) => ({ ...prev, name: sanitizeAlphaOnly(value).slice(0, FIELD_LIMITS.name) }));
    return;
  }

  if (name === "address") {
    setFormData((prev) => ({ ...prev, address: sanitizeAddress(value).slice(0, FIELD_LIMITS.address) }));
    return;
  }

  if (["liked", "otherInterestText", "attendedDetail"].includes(name)) {
    const limit = name === "otherInterestText" ? FIELD_LIMITS.otherSeva : FIELD_LIMITS.liked;
    setFormData((prev) => ({ ...prev, [name]: sanitizeTextOnly(value).slice(0, limit) }));
    return;
  }

  if (name === "mobile") {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("05")) digits = digits.slice(2);
    setFormData((prev) => ({ ...prev, mobile: `05${digits.slice(0, FIELD_LIMITS.mobileDigitsAfterPrefix)}` }));
    return;
  }

  if (name === "whatsapp") {
    const digits = value.replace(/[^\d]/g, "").slice(0, FIELD_LIMITS.whatsapp);
    setFormData((prev) => ({ ...prev, whatsapp: `+${digits}` }));
    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Validate fields using validation rules
    const nameErr = validateFullName(formData.name);
    const mobileErr = validateUAEMobile(formData.mobile);
    const waErr = validateWhatsapp(formData.whatsapp);
    const emailErr = validateEmail(formData.email);
    const addrErr = validateAddress(formData.address);

    if (nameErr || mobileErr || waErr || emailErr || addrErr) {
      setErrorMsg(nameErr || mobileErr || waErr || emailErr || addrErr);
      setLoading(false);
      return;
    }

    if (
      formData.interestedInSeva &&
      formData.sevaInterest.toLowerCase() === "other" &&
      !formData.otherInterestText.trim()
    ) {
      setErrorMsg("Please specify your seva interest.");
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      mobile: formData.mobile.trim(), // Sent as full 10 digits starting with '05'
      whatsapp_no: formData.whatsapp.trim(), // Sent with leading '+' prefix
      email: formData.email.trim(),
      emirate: formData.emirate,
      address: formData.address.trim(),
      liked: formData.liked.trim(),
      seva_interested: formData.interestedInSeva
        ? formData.sevaInterest.toLowerCase() === "other"
          ? formData.otherInterestText.trim()
          : formData.sevaInterest
        : "None",
      subscribed_updates: formData.subscribeUpdates,
      attended: formData.attendedDetail.trim(),
    };

    try {
      const { error } = await supabase.from("connected_devotees").insert([payload]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit registration.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-112px)] bg-slate-50 flex items-center justify-center p-4 font-['Arimo',sans-serif]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {FORM_CONTENT.getConnected.successHeading}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {FORM_CONTENT.getConnected.successMessage}
          </p>
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

  const whatsappDigitCount = formData.whatsapp.startsWith("+")
    ? formData.whatsapp.slice(1).length
    : formData.whatsapp.length;

  return (
    <FormPageLayout>
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {FORM_CONTENT.getConnected.heading}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {FORM_CONTENT.getConnected.subheading}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Full Name */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            maxLength={FIELD_LIMITS.name}
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Enter Full Name"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.name.length}/{FIELD_LIMITS.name}
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

        {/* Email Address */}
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

        {/* Updates Subscription Checkbox */}
        <div className="pt-1">
          <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              name="subscribeUpdates"
              checked={formData.subscribeUpdates}
              onChange={handleChange}
              className="rounded text-sky-600 h-4 w-4 cursor-pointer"
            />
            <span>Would you like to subscribe for regular program updates?</span>
          </label>
        </div>

        {/* Residential Address (Stacked vertically, enlarged height) */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Residential Address *
          </label>
          <textarea
            rows={3}
            name="address"
            required
            maxLength={FIELD_LIMITS.address}
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
            placeholder="Building, Flat, Street"
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.address.length}/{FIELD_LIMITS.address}
          </div>
        </div>

        {/* Select Emirate */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Select Emirate *
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

        {/* What Did You Like In Our Programme (Enlarged height) */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            What did you like in our program?
          </label>
          <textarea
            rows={3}
            name="liked"
            maxLength={FIELD_LIMITS.liked}
            value={formData.liked}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
            placeholder="Kirtan, Katha, Arati, Prasadam, etc."
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.liked.length}/{FIELD_LIMITS.liked}
          </div>
        </div>

        {/* Seva Interest */}
        <div>
          <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              name="interestedInSeva"
              checked={formData.interestedInSeva}
              onChange={handleChange}
              className="rounded text-sky-600 h-4 w-4 cursor-pointer"
            />
            <span>Would you be interested in Seva (loving devotional service)?</span>
          </label>
          {formData.interestedInSeva && (
            <div className="mt-3 space-y-2">
              <select
                name="sevaInterest"
                value={formData.sevaInterest}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer"
              >
                {FORM_CONTENT.sevaOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {formData.sevaInterest.toLowerCase() === "other" && (
                <div>
                  <input
                    type="text"
                    name="otherInterestText"
                    maxLength={FIELD_LIMITS.otherSeva}
                    value={formData.otherInterestText}
                    onChange={handleChange}
                    placeholder="Specify your seva interest"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="text-right text-[11px] text-slate-500 mt-1">
                    {formData.otherInterestText.length}/{FIELD_LIMITS.otherSeva}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Details of the Damodara Arati Attended (Enlarged height) */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">
            Details of the Damodara Arati Attended
          </label>
          <textarea
            rows={3}
            name="attendedDetail"
            maxLength={FIELD_LIMITS.attended}
            value={formData.attendedDetail}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y"
            placeholder="Host Name, Area, etc."
          />
          <div className="text-right text-[11px] text-slate-500 mt-1">
            {formData.attendedDetail.length}/{FIELD_LIMITS.attended}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase mt-4 cursor-pointer"
        >
          {loading ? "Submitting..." : FORM_CONTENT.getConnected.buttonText}
        </button>
      </form>
    </FormPageLayout>
  );
}