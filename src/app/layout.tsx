import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/nav/Navbar";
import { CursorDot } from "@/components/motion/CursorDot";
import { PixelReveal } from "@/components/motion/PixelReveal";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zihan Fakir — Full-Stack Developer",
  description: "Zihan Fakir — full-stack developer and software craftsman. Portfolio, projects & work.",
  keywords: ["Zihan Fakir", "Portfolio", "Full-Stack Developer", "Next.js", "React", "Three.js", "Dhaka"],
  authors: [{ name: "Zihan Fakir", url: "https://zihan.uk" }],
  openGraph: {
    title: "Zihan Fakir — Full-Stack Developer",
    description: "Zihan Fakir — full-stack developer and software craftsman. Portfolio, projects & work.",
    url: "https://zihan.uk",
    siteName: "Zihan Fakir",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zihan Fakir — Full-Stack Developer",
    description: "Zihan Fakir — full-stack developer and software craftsman. Portfolio, projects & work.",
    creator: "@ZihanFakir",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-blue-500 selection:text-black font-sans">
        <SmoothScrollProvider>
          <Navbar />
          <PixelReveal />
          <CursorDot />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
