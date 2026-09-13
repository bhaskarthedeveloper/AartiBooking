"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ASSETS, SOCIAL_LINKS } from "@/lib/constants";

export default function TopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full shadow-xs">
      {/* ================= 1. DESKTOP ONLY VIEW (> 798px) ================= */}
      <div className="hidden min-[799px]:block">
        {/* Soft Contact Bar (56px) */}
        <div className="h-[56px] bg-[#E9DDDD] px-8 lg:px-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="w-[45px] h-[45px] relative">
              <Image
                src={ASSETS.iskconLogo}
                alt="Logo"
                fill
                className="object-contain"
                sizes="45px"
              />
            </div>
          </Link>

          <div className="flex items-center space-x-8 lg:space-x-12">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[rgba(67,33,1,0.4)] flex items-center justify-center text-white shrink-0 text-xs">
                ✉
              </div>
              <div className="leading-tight">
                <div className="font-bold text-[13px] text-black">Mail us:</div>
                <a
                  href={SOCIAL_LINKS.mailComposeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[13px] text-black hover:text-blue-600 transition"
                >
                  {SOCIAL_LINKS.mailDisplay}
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[rgba(67,33,1,0.4)] flex items-center justify-center text-white shrink-0 text-xs">
                ☎
              </div>
              <div className="leading-tight">
                <div className="font-bold text-[13px] text-black">WhatsApp us:</div>
                <a
                  href={SOCIAL_LINKS.whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[13px] text-black hover:text-blue-600 transition"
                >
                  {SOCIAL_LINKS.whatsAppDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Bar (56px) */}
        <nav className="h-[56px] bg-white border-b border-slate-200 px-8 lg:px-14 flex items-center justify-between">
          <div className="flex items-center space-x-10 lg:space-x-14 mx-auto font-bold text-[18px] lg:text-[20px] text-black">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <Link href="/login" className="hover:text-blue-600 transition">Senapati Log-in</Link>
            <Link href="/gallery" className="hover:text-blue-600 transition">Gallery</Link>
            <Link href="/book-aarti" className="hover:text-blue-600 transition">Book Arati</Link>
            <Link href="/get-connected" className="hover:text-blue-600 transition">Get Connected</Link>
          </div>

          <div className="flex items-center space-x-4 text-black">
            <a
              href={SOCIAL_LINKS.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-red-600 transition"
              aria-label="YouTube"
            >
              ▶
            </a>
            <a
              href={SOCIAL_LINKS.facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition font-bold"
              aria-label="Facebook"
            >
              f
            </a>
          </div>
        </nav>
      </div>

      {/* ================= 2. LAPTOP & MOBILE VIEW (<= 798px) ================= */}
      {/* Single Unified Bar: Hamburger on left, Lotus Logo centered */}
      <div className="min-[799px]:hidden h-[56px] bg-white border-b border-slate-200 px-4 flex items-center justify-between relative">
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="text-2xl text-slate-800 p-1.5 hover:bg-slate-100 rounded-md focus:outline-none"
          aria-label="Open Navigation Drawer"
        >
          ☰
        </button>

        {/* Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <Link href="/">
            <div className="w-[38px] h-[38px] relative">
              <Image
                src={ASSETS.iskconLogo}
                alt="Logo"
                fill
                className="object-contain"
                sizes="38px"
              />
            </div>
          </Link>
        </div>

        <div className="w-8" />
      </div>

      {/* Slide-out / Dropdown Menu for Laptop and Mobile */}
      {drawerOpen && (
        <div className="min-[799px]:hidden bg-white border-b border-slate-200 shadow-xl px-6 py-5 space-y-4 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-3 font-bold text-[17px] border-b pb-4">
            <Link href="/" onClick={() => setDrawerOpen(false)} className="block py-1 hover:text-blue-600">Home</Link>
            <Link href="/login" onClick={() => setDrawerOpen(false)} className="block py-1 hover:text-blue-600">Senapati Log-in</Link>
            <Link href="/gallery" onClick={() => setDrawerOpen(false)} className="block py-1 hover:text-blue-600">Gallery</Link>
            <Link href="/book-aarti" onClick={() => setDrawerOpen(false)} className="block py-1 hover:text-blue-600">Book Arati</Link>
            <Link href="/get-connected" onClick={() => setDrawerOpen(false)} className="block py-1 hover:text-blue-600">Get Connected</Link>
          </div>

          {/* Contact Details Inside Hamburger Menu */}
          <div className="space-y-3 pt-1 text-xs">
            <a
              href={SOCIAL_LINKS.mailComposeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 text-slate-700 hover:text-blue-600"
            >
              <div className="w-7 h-7 rounded-full bg-[rgba(67,33,1,0.4)] flex items-center justify-center text-white text-[11px]">
                ✉
              </div>
              <div>
                <span className="font-bold block text-slate-500 text-[11px]">Mail us:</span>
                <span className="font-bold">{SOCIAL_LINKS.mailDisplay}</span>
              </div>
            </a>

            <a
              href={SOCIAL_LINKS.whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 text-slate-700 hover:text-emerald-700"
            >
              <div className="w-7 h-7 rounded-full bg-[rgba(67,33,1,0.4)] flex items-center justify-center text-white text-[11px]">
                ☎
              </div>
              <div>
                <span className="font-bold block text-slate-500 text-[11px]">WhatsApp us:</span>
                <span className="font-bold">{SOCIAL_LINKS.whatsAppDisplay}</span>
              </div>
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 text-sm">
            <a href={SOCIAL_LINKS.youtubeUrl} target="_blank" rel="noreferrer" className="text-red-600 font-bold">
              YouTube ▶
            </a>
            <a href={SOCIAL_LINKS.facebookUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold">
              Facebook f
            </a>
          </div>
        </div>
      )}
    </header>
  );
}