import type { Metadata } from "next";
import { Arimo, Dancing_Script } from "next/font/google";
import TopBar from "@/components/navigation/TopBar";
import ChunkErrorListener from "@/components/common/ChunkErrorListener";
import "./globals.css";

// 1. Default global font across the entire application (Flutter: GoogleFonts.arimo)
const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-arimo",
});

// 2. Specialized display font used strictly for the hero banner (Flutter: GoogleFonts.dancingScript)
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dancing",
});

export const metadata: Metadata = {
  title: "Hare Krishna - ISKCON Damodardesh",
  description:
    "Book a Damodara Arati to be held at your residence on your preferred date and time.",
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${arimo.variable} ${dancingScript.variable}`}>
      <body className={`${arimo.className} bg-white text-gray-900 antialiased text-[15px]`}>
        <ChunkErrorListener />
        <TopBar />
        {children}
      </body>
    </html>
  );
}