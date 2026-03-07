"use client";

import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Zap, CheckCircle, TrendingUp, BarChart3, History, Globe } from "lucide-react";

const FEATURES = [
    { icon: TrendingUp, text: "Daily AI predictions with plain-English verdicts" },
    { icon: BarChart3, text: "Model probability, edge %, EV & CLV per match" },
    { icon: Zap, text: "Full Analysis with market breakdown & Best Verdict" },
    { icon: Globe, text: "23-league coverage — UCL to Conference League" },
    { icon: History, text: "Prediction history & model accuracy tracking" },
];

/** Blurred placeholder card used in the preview strip */
function GhostCard({ delay }: { delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="flex-shrink-0 w-64 sm:w-72 bg-[#0D1117] border border-amber-400/10 rounded-xl h-72 blur-[3px] opacity-40 pointer-events-none select-none"
        />
    );
}

export function AuthGate() {
    return (
        <section className="container mx-auto px-4 py-12">

            {/* ── 2-COL SPLIT ── */}
            <div className="relative bg-[#0D1117] border border-amber-400/20 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.06)]">

                {/* Ambient top glow */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-400/8 blur-3xl rounded-full pointer-events-none" />

                <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">

                    {/* ── LEFT: Feature proposition ── */}
                    <div className="px-8 py-10 md:px-12 md:py-12 border-b md:border-b-0 md:border-r border-[#1F2937]/60">

                        {/* Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest w-fit mb-6">
                            <Zap className="w-3 h-3" />
                            Members Only
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                            Unlock Full Terminal
                        </h2>
                        <p className="text-sm text-white/40 font-medium mb-8 leading-relaxed max-w-sm">
                            Free account. Instant access. AI-powered predictions updated every 3 hours across 23 leagues.
                        </p>

                        <ul className="space-y-3.5">
                            {FEATURES.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-white/65 font-medium leading-snug">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── RIGHT: CTAs ── */}
                    <div className="flex flex-col justify-center px-8 py-10 md:px-12 md:py-12 md:min-w-[280px]">
                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] mb-6">
                            Get started — it&apos;s free
                        </p>

                        <div className="flex flex-col gap-3">
                            <SignInButton mode="modal">
                                <button className="w-full py-3.5 rounded-xl bg-[#FBBF24] hover:bg-white transition-all text-sm font-black text-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                    Sign In
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="w-full py-3.5 rounded-xl bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-sm font-bold text-white/70 hover:text-white uppercase tracking-widest">
                                    Create Free Account
                                </button>
                            </SignUpButton>
                        </div>

                        <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest mt-6 leading-relaxed">
                            No credit card<br />No subscription<br />Free forever
                        </p>
                    </div>
                </div>
            </div>

            {/* ── BLURRED CARD PREVIEW STRIP ── */}
            <div className="relative mt-6 overflow-hidden">
                <div className="flex gap-4 overflow-x-hidden pointer-events-none select-none">
                    <GhostCard delay={0.1} />
                    <GhostCard delay={0.2} />
                    <GhostCard delay={0.3} />
                </div>
                {/* Gradient fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B0F14]" />
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] whitespace-nowrap">
                    Sign in to unlock predictions
                </p>
            </div>

        </section>
    );
}
