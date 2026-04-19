import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-dvh bg-surface text-ink">{children}</body>
    </html>
  );
}
