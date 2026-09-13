"use client";

import React from "react";
import Image from "next/image";
import { ASSETS, SOCIAL_LINKS, SIDEBAR_CONTENT } from "@/lib/constants";

interface FormPageLayoutProps {
  children: React.ReactNode;
}

export default function FormPageLayout({ children }: FormPageLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-112px)] bg-slate-50/60 py-10 px-4 sm:px-8 font-['Arimo',sans-serif]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 min-[799px]:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Sticky Sidebar (Visible strictly on Desktop > 798px) */}
        <aside className="hidden min-[799px]:block min-[799px]:col-span-5 self-start sticky top-[130px] space-y-4">
          {/* Main Visual Image Card */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
            <Image
              src={ASSETS.howItWorks1}
              alt="Pastimes of Lord Damodara"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 800px) 420px, 100vw"
            />
          </div>

          {/* Guidelines Card Sourced from Central Constants */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wider border-b pb-2">
              {SIDEBAR_CONTENT.heading}
            </h3>

            <ul className="space-y-2.5 text-slate-600 leading-relaxed">
              {SIDEBAR_CONTENT.guidelines.map((text, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-[#84C341] font-bold">✓</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              {SIDEBAR_CONTENT.supportLabel}{" "}
              <a
                href={SOCIAL_LINKS.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#18A2B8] hover:underline"
              >
                {SOCIAL_LINKS.whatsAppDisplay}
              </a>
            </div>
          </div>
        </aside>

        {/* Right Form Workspace */}
        <main className="col-span-1 min-[799px]:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {children}
        </main>

      </div>
    </div>
  );
}