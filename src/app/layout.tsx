import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PitchPulse | Elite Sports Predictions",
  description: "Advanced AI-powered sports predictions and match analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          outfit.className,
          "min-h-screen bg-[#020202] text-white antialiased selection:bg-purple-500/30"
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          {/* Background effects */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-indigo-600/10 blur-[120px] rounded-full" />
          </div>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
