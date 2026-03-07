"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Zap, CheckCircle, TrendingUp, BarChart3, History, Globe } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const FEATURES = [
    { icon: TrendingUp, text: "Daily AI predictions with plain-English verdicts" },
    { icon: BarChart3, text: "Model probability, edge %, EV & CLV analysis" },
    { icon: Zap, text: "Full Analysis with market breakdown per match" },
    { icon: Globe, text: "23-league coverage — UCL to Conference League" },
    { icon: History, text: "Prediction history & accuracy tracking" },
];

export function AuthGate() {
    return (
        <section className="container mx-auto px-4 py-16">
            {/* Blurred preview hint */}
            <div className="relative mb-0 pointer-events-none select-none overflow-hidden rounded-xl" style={{ maxHeight: 120 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 blur-sm scale-95 origin-top">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#0D1117] rounded-xl border border-amber-500/20 h-[280px]" />
                    ))}
                </div>
                {/* Fade-out gradient */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B0F14] to-transparent" />
            </div>

            {/* Gate Card */}
            <div className="max-w-lg mx-auto -mt-2">
                <div className="relative bg-[#0D1117] border border-amber-400/20 rounded-2xl p-8 shadow-[0_0_80px_rgba(251,191,36,0.07)]">

                    {/* Ambient glow */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <BrandLogo size="md" showText={true} />
                    </div>

                    {/* Badge */}
                    <div className="flex justify-center mb-5">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                            <Zap className="w-3 h-3" />
                            Members Only
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="text-center mb-7">
                        <h2 className="text-xl font-black text-white tracking-tight mb-2">
                            Unlock Full Terminal Intelligence
                        </h2>
                        <p className="text-sm text-white/40 font-medium leading-relaxed">
                            Create a free account to access AI-powered predictions
                            across 23 leagues, updated every 3 hours.
                        </p>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-3 mb-8">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-white/70 font-medium leading-snug">{text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTAs */}
                    <div className="flex flex-col gap-3">
                        <SignInButton mode="modal">
                            <button className="w-full py-3.5 rounded-xl bg-[#FBBF24] hover:bg-white transition-all text-sm font-black text-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                Sign In to Terminal
                            </button>
                        </SignInButton>

                        <SignUpButton mode="modal">
                            <button className="w-full py-3.5 rounded-xl bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-sm font-bold text-white/70 hover:text-white uppercase tracking-widest">
                                Create Free Account
                            </button>
                        </SignUpButton>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-5">
                        No credit card &nbsp;·&nbsp; No subscription &nbsp;·&nbsp; Free forever
                    </p>
                </div>
            </div>
        </section>
    );
}
