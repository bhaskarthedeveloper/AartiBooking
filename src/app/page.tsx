"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ASSETS,
  CONTENT,
  ACTION_CARDS,
  KARTHIK_BANNER_LABEL,
} from "@/lib/constants";

export default function HomePage() {
  const [currentTextIdx, setCurrentTextIdx] = useState(0);

  const bannerTexts = [
    KARTHIK_BANNER_LABEL,
    CONTENT.bannerSubtitle,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIdx((prev) => (prev + 1) % bannerTexts.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [bannerTexts.length]);

  return (
    <main className="min-h-screen bg-white text-slate-800 flex flex-col font-['Arimo',sans-serif]">
      {/* ================= 1. HERO BANNER ================= */}
      {/* Desktop (> 798px), Laptop (714px - 798px), Mobile (< 714px) */}
      <section className="relative w-full h-[65vh] min-[714px]:h-[72vh] min-[799px]:h-[75vh] min-h-[440px] bg-slate-950 overflow-hidden">
        {/* Mobile View Image (< 714px): cover2_lowres.jpg */}
        <div className="block min-[714px]:hidden absolute inset-0">
          <Image
            src={ASSETS.heroBannerMobile}
            alt="Banner"
            fill
            priority
            className="object-cover object-top"
          />
        </div>

        {/* Laptop and Desktop View Image (>= 714px): bgcover.jpg */}
        <div className="hidden min-[714px]:block absolute inset-0">
          <Image
            src={ASSETS.heroBanner}
            alt="Banner"
            fill
            priority
            className="object-cover object-center opacity-95"
          />
        </div>

        {/* Floating Banner Ribbon: Displayed ONLY on Desktop (> 798px) */}
        <div className="hidden min-[799px]:block absolute top-[7%] left-[15%] w-[70%] bg-white/40 backdrop-blur-xs py-2 px-6 rounded-xs shadow-lg text-center transition-all duration-700">
          <h1
            style={{ fontFamily: "var(--font-dancing), cursive" }}
            className="text-2xl sm:text-[36px] lg:text-[40px] font-bold leading-tight animate-flutter-colorize"
          >
            {bannerTexts[currentTextIdx]}
          </h1>
        </div>
      </section>

      {/* ================= 2. FULL-WIDTH ACTION CARDS ================= */}
      {/* Mobile (< 714px): Vertical stack taking full width */}
      {/* Laptop & Desktop (>= 714px): 4-column horizontal ribbon */}
      <section className="w-full bg-[rgba(23,91,126,0.6)]">
        <div className="w-full grid grid-cols-1 min-[714px]:grid-cols-4">
          {ACTION_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`${card.bgColor} text-white py-10 px-6 transition flex flex-col items-center justify-center text-center min-h-[260px] min-[714px]:min-h-[300px] border-b min-[714px]:border-b-0 min-[714px]:border-r last:border-none border-white/20`}
            >
              <div className="w-20 h-20 relative mb-4">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </div>
              <h3 className="text-[20px] min-[714px]:text-[22px] font-bold mb-2 text-white">
                {card.title}
              </h3>
              <p className="text-[13px] min-[714px]:text-[14px] text-white leading-relaxed whitespace-pre-line font-medium max-w-sm">
                {card.disp}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= 3. "HOW DOES IT WORK?" SECTION ================= */}
      {/* Mobile (< 714px): Arranged vertically with only 1 image */}
      {/* Laptop & Desktop (>= 714px): 2 side-by-side images and quote box */}
      <section className="py-12 min-[714px]:py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 min-[799px]:grid-cols-3 gap-8 min-[799px]:gap-10 items-center bg-white">
        <div className="min-[799px]:col-span-2 space-y-6 text-center min-[714px]:text-left">
          <h2 className="text-[26px] min-[714px]:text-[30px] font-bold text-[#432101]">
            {CONTENT.howItWorksHeading}
          </h2>
          <p className="text-black text-[14px] min-[714px]:text-[15px] leading-relaxed">
            {CONTENT.howItWorksPara}
          </p>

          <div className="flex flex-wrap gap-8 pt-4 items-center justify-center min-[714px]:justify-start">
            {/* Image 1: Always visible */}
            <div className="relative aspect-square w-[220px] h-[220px] rounded-md overflow-hidden shadow-xs border border-slate-200">
              <Image
                src={ASSETS.howItWorks1}
                alt="How it works 1"
                fill
                className="object-cover"
                sizes="220px"
              />
            </div>

            {/* Image 2: Hidden on Mobile (< 714px), shown on Laptop & Desktop */}
            <div className="hidden min-[714px]:block relative aspect-square w-[220px] h-[220px] rounded-md overflow-hidden shadow-xs border border-slate-200">
              <Image
                src={ASSETS.howItWorks2}
                alt="How it works 2"
                fill
                className="object-cover"
                sizes="220px"
              />
            </div>
          </div>
        </div>

        {/* Scriptural Quote Box */}
        <div className="border border-slate-300 rounded-lg p-6 sm:p-8 bg-white text-center flex flex-col items-center justify-center space-y-4 shadow-xs mt-4 min-[799px]:mt-0">
          {/* Top Opening Quote */}
          <svg
            className="w-5 h-5 text-[#607D8B] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-4v-10h10z" />
          </svg>

          {/* Top Divider Line */}
          <div className="w-full border-t border-slate-300 my-1" />

          {/* Sanskrit Verse */}
          <div className="text-[#2196F3] font-bold text-[15px] leading-relaxed whitespace-pre-line">
            {CONTENT.stotramSanskritLine1}
            <br />
            {CONTENT.stotramSanskritLine2}
            <br />
            {CONTENT.stotramSanskritLine3}
            <br />
            {CONTENT.stotramSanskritLine4}
          </div>

          {/* Verse Citation */}
          <div className="text-black font-bold text-[14px]">
            {CONTENT.stotramReference}
          </div>

          {/* English Meaning */}
          <div className="text-[#2196F3] font-bold text-[14px] leading-relaxed">
            {CONTENT.stotramMeaningBody}
          </div>

          {/* Bottom Divider Line */}
          <div className="w-full border-t border-slate-300 my-1" />

          {/* Bottom Closing Quote */}
          <svg
            className="w-5 h-5 text-[#607D8B] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
          </svg>
        </div>
      </section>

      {/* ================= 4. GLORIES OF DIPA-DANA ================= */}
      <section className="py-12 min-[714px]:py-16 px-6 lg:px-14 bg-white border-t border-slate-200">
        <h2 className="text-[26px] min-[714px]:text-[32px] font-bold text-[#432101] text-center mb-8 min-[799px]:mb-12">
          {CONTENT.gloriesHeading}
        </h2>

        {/* DESKTOP VIEW (> 798px): 3-Column Stage (Left Texts | Center Diya | Right Texts) */}
        <div className="hidden min-[799px]:grid max-w-7xl mx-auto grid-cols-3 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-10">
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 relative shrink-0">
                <Image src={ASSETS.flower} alt="Flower" fill className="object-contain" sizes="44px" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory1}
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 relative shrink-0">
                <Image src={ASSETS.flower} alt="Flower" fill className="object-contain" sizes="44px" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory3}
              </p>
            </div>
          </div>

          {/* Center Column: Diya */}
          <div className="flex justify-center items-center py-4">
            <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
              <Image
                src={ASSETS.diya}
                alt="Glories Diya"
                fill
                className="object-contain drop-shadow-xl"
                sizes="288px"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 relative shrink-0">
                <Image src={ASSETS.flower} alt="Flower" fill className="object-contain" sizes="44px" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory2}
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 relative shrink-0">
                <Image src={ASSETS.flower} alt="Flower" fill className="object-contain" sizes="44px" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory4}
              </p>
            </div>
          </div>
        </div>

        {/* LAPTOP & MOBILE VIEW (<= 798px): Centered Diya followed by 4 vertical points without flower icons */}
        <div className="min-[799px]:hidden max-w-xl mx-auto flex flex-col items-center">
          {/* Centered Diya directly under Title */}
          <div className="w-48 h-48 relative mb-6">
            <Image
              src={ASSETS.diya}
              alt="Glories Diya"
              fill
              className="object-contain"
              sizes="192px"
            />
          </div>

          {/* 4 Points aligned vertically one after another */}
          <div className="w-full space-y-4 text-left">
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory1}
              </p>
            </div>
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory2}
              </p>
            </div>
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory3}
              </p>
            </div>
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50">
              <p className="text-xs sm:text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                {CONTENT.glory4}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. FOOTER ================= */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-6 text-center text-xs">
        <p>{CONTENT.footerText}</p>
      </footer>
    </main>
  );
}