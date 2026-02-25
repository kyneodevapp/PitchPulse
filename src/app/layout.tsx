import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pitchpulse.app"),
  title: {
    default: "PitchPulse | Elite Football Predictions",
    template: "%s | PitchPulse",
  },
  description: "Institutional-grade football predictions powered by Poisson modelling, Monte Carlo simulation, and real-time bookmaker data. Edge Engine v3.",
  keywords: ["football predictions", "sports betting analysis", "match analysis", "Premier League predictions", "AI football tips", "edge betting"],
  authors: [{ name: "PitchPulse" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "PitchPulse",
    title: "PitchPulse | Elite Football Predictions",
    description: "Institutional-grade football predictions powered by Poisson modelling, Monte Carlo simulation, and real-time bookmaker data.",
    url: "/",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PitchPulse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchPulse | Elite Football Predictions",
    description: "Institutional-grade football predictions powered by AI and real-time bookmaker data.",
    images: ["/og-image.png"],
  },
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning on <html> is intentional: browser extensions
          (e.g. dark-mode tools) can add attributes between SSR and hydration. */}
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={cn(
            outfit.className,
            "min-h-screen bg-[#020202] text-white antialiased selection:bg-amber-500/30"
          )}
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            {/* Background effects */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-600/5 blur-[120px] rounded-full" />
              <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-yellow-600/5 blur-[120px] rounded-full" />
            </div>

            <main className="flex-1">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
