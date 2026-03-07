"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Zap, CheckCircle, TrendingUp, BarChart3, History, Globe, ShieldAlert } from "lucide-react";

const FEATURES = [
    { icon: TrendingUp, text: "Daily AI predictions with plain-English verdicts" },
    { icon: BarChart3, text: "Model probability, edge %, EV & CLV per match" },
    { icon: Zap, text: "Full Analysis with market breakdown & Best Verdict" },
    { icon: Globe, text: "23-league coverage — UCL to Conference League" },
    { icon: History, text: "Prediction history & model accuracy tracking" },
];

export interface PreviewMatch {
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string;
    awayLogo?: string;
    leagueName?: string;
    prediction?: string;
    odds?: number;
    riskTier?: string;
    confidence?: number;
}

/** Blurred preview card — real data, no interactions, no API calls */
function BlurredCard({ match }: { match: PreviewMatch }) {
    return (
        <div className="flex-shrink-0 w-64 bg-[#0D1117] border border-amber-400/10 rounded-xl overflow-hidden pointer-events-none select-none">
            <div className="p-4 flex flex-col gap-3">
                {/* League + tier */}
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest bg-[#161B22] px-2 py-0.5 rounded">
                        {match.leagueName || "League"}
                    </span>
                    <span className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">
                        {match.riskTier || "A"}
                    </span>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-2">
                    <div className="flex flex-col items-center gap-1.5">
                        {match.homeLogo ? (
                            <img src={match.homeLogo} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                            <ShieldAlert className="w-8 h-8 text-neutral-800" />
                        )}
                        <span className="text-[9px] font-black text-white/60 text-center leading-tight [text-wrap:balance]">
                            {match.homeTeam}
                        </span>
                    </div>
                    <span className="text-[8px] font-black text-neutral-800">VS</span>
                    <div className="flex flex-col items-center gap-1.5">
                        {match.awayLogo ? (
                            <img src={match.awayLogo} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                            <ShieldAlert className="w-8 h-8 text-neutral-800" />
                        )}
                        <span className="text-[9px] font-black text-white/60 text-center leading-tight [text-wrap:balance]">
                            {match.awayTeam}
                        </span>
                    </div>
                </div>

                {/* Signal + odds */}
                <div className="flex items-end justify-between border-t border-[#1E293B]/50 pt-3">
                    <div>
                        <span className="text-[7px] font-semibold text-neutral-600 uppercase tracking-widest">Signal</span>
                        <p className="text-[10px] font-bold text-white/50 uppercase leading-snug mt-0.5">
                            {match.prediction || "—"}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-[7px] font-semibold text-neutral-600 uppercase tracking-widest">Odds</span>
                        <p className="text-xl font-black text-amber-400/40 tabular-nums">
                            {match.odds ? match.odds.toFixed(2) : "—"}
                        </p>
                    </div>
                </div>

                {/* Confidence bar */}
                {match.confidence && (
                    <div className="h-1 bg-[#0B0F14] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400/20 rounded-full" style={{ width: `${match.confidence}%` }} />
                    </div>
                )}
            </div>
        </div>
    );
}

interface AuthGateProps {
    previewMatches?: PreviewMatch[];
}

export function AuthGate({ previewMatches = [] }: AuthGateProps) {
    return (
        <section className="container mx-auto px-4 py-12">

            {/* ── 2-COL SPLIT ── */}
            <div className="relative bg-[#0D1117] border border-amber-400/20 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.06)]">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-400/8 blur-3xl rounded-full pointer-events-none" />

                <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">

                    {/* LEFT: Feature proposition */}
                    <div className="px-8 py-10 md:px-12 md:py-12 border-b md:border-b-0 md:border-r border-[#1F2937]/60">
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

                    {/* RIGHT: CTAs */}
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

            {/* ── BLURRED REAL CARD PREVIEW STRIP ── */}
            {previewMatches.length > 0 && (
                <div className="relative mt-6">
                    <div className="flex gap-4 overflow-x-hidden">
                        {previewMatches.map((m, i) => (
                            <div key={i} className="opacity-40 blur-[2px]">
                                <BlurredCard match={m} />
                            </div>
                        ))}
                    </div>
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/50 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B0F14] pointer-events-none" />
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] whitespace-nowrap">
                        Sign in to unlock predictions
                    </p>
                </div>
            )}
        </section>
    );
}
