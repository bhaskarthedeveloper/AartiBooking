"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MEDIA_ASSETS,
  GALLERY_SECTIONS,
  GalleryMediaItem,
} from "@/lib/constants";

// Ambient neon shadow colors (from colorList in Flutter youtube_video_info.dart)
const AMBIENT_SHADOWS = [
  "shadow-[0_16px_25px_-5px_rgba(255,152,0,0.55)]", // Orange
  "shadow-[0_16px_25px_-5px_rgba(244,67,54,0.55)]",  // Red
  "shadow-[0_16px_25px_-5px_rgba(255,214,0,0.6)]",   // Yellow
  "shadow-[0_16px_25px_-5px_rgba(3,169,244,0.55)]",  // Light Blue
];

export default function GalleryPage() {
  const [activeItem, setActiveItem] = useState<GalleryMediaItem | null>(null);

  return (
    <div className="min-h-[calc(100vh-112px)] bg-[#F0F4F8] text-slate-800 py-12 px-4 sm:px-8 font-['Arimo',sans-serif]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Fullscreen Video / PDF Viewer Overlay */}
        {activeItem && (
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-2xl relative mb-10 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-white/20 mb-4">
              <h3 className="font-bold text-sm sm:text-base">{activeItem.name}</h3>
              <button
                onClick={() => setActiveItem(null)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-bold transition"
              >
                ✕ Close
              </button>
            </div>

            {activeItem.contentType === "video" ? (
              <div className="aspect-video w-full max-h-[70vh] rounded-xl overflow-hidden bg-black mx-auto">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeItem.videoUrl}?autoplay=1`}
                  title={activeItem.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-[70vh] bg-white rounded-xl overflow-hidden">
                <iframe
                  src={activeItem.videoUrl}
                  title={activeItem.name}
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Gallery Sections */}
        {GALLERY_SECTIONS.map((section) => (
          <div key={section.key} className="space-y-6">
            <h2 className="text-[17px] sm:text-[19px] font-bold text-[#4B6B82] tracking-wide">
              {section.title}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
              {section.items.map((item, idx) => {
                const isVideo = item.contentType === "video";
                const shadowClass = AMBIENT_SHADOWS[idx % AMBIENT_SHADOWS.length];
                const youtubeThumbnail = `https://img.youtube.com/vi/${item.videoUrl}/hqdefault.jpg`;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isVideo) {
                        window.open(item.videoUrl, "_blank", "noopener,noreferrer");
                      } else {
                        setActiveItem(item);
                        window.scrollTo({ top: 120, behavior: "smooth" });
                      }
                    }}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    {/* Media Window Card */}
                    <div
                      className={`w-full aspect-[16/10] rounded-sm relative overflow-hidden flex flex-col justify-between transition-transform duration-200 group-hover:scale-105 ${
                        isVideo ? "bg-black" : "bg-[#C8CCD0] p-2"
                      } ${shadowClass}`}
                    >
                      {isVideo ? (
                        <>
                          {/* Real YouTube Video Thumbnail */}
                          <Image
                            src={youtubeThumbnail}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:opacity-90 transition"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            unoptimized
                          />

                          {/* Dark vignette overlay for contrast */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />

                          {/* Center YouTube Play Icon Badge */}
                          <div className="relative z-10 flex-1 flex items-center justify-center">
                            <div className="w-10 h-10 relative drop-shadow-md">
                              <Image
                                src={MEDIA_ASSETS.youtubeLogo}
                                alt="Play Video"
                                fill
                                className="object-contain"
                                sizes="40px"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* PDF Document Card */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="w-11 h-11 relative drop-shadow-xs">
                              <Image
                                src={MEDIA_ASSETS.pdfLogo}
                                alt="Open PDF"
                                fill
                                className="object-contain"
                                sizes="44px"
                              />
                            </div>
                          </div>

                          {/* Mock bottom control strip */}
                          <div className="w-full h-2 flex items-center justify-between px-1 opacity-70">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <div className="flex-1 h-[2px] bg-slate-400 mx-1.5" />
                            <div className="w-3 h-1.5 bg-slate-500 rounded-2xs" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Centered Caption Underneath */}
                    <p className="mt-3 text-center text-[13px] font-medium text-slate-800 leading-snug px-1 group-hover:text-blue-700 transition">
                      {item.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}