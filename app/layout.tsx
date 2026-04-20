import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { CommandPalette } from "@/components/command/CommandPalette";
import { TooltipProvider } from "@/components/ui/Tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ai-video-router",
  description:
    "Describe a video, get the right code-based video library, scaffold it, and iterate with Claude Code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh bg-surface text-ink">
        <TooltipProvider delayDuration={200}>
          {children}
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  );
}
