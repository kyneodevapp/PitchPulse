"use client";

import { motion } from "framer-motion";
import { Snowflake, Check, X, Clock, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccaFreeze, AccaLeg, FreezeRecommendation } from "@/lib/engine/accaFreeze";

// ============ THEME ============

const RECOMMENDATION_STYLES: Record<FreezeRecommendation, {
    bg: string; text: string; border: string; label: string; icon: string;
}> = {
    LET_IT_RIDE: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        label: "Let It Ride",
        icon: "🟢",
    },
    CONSIDER_FREEZING: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        label: "Consider Freezing",
        icon: "🟡",
    },
    FREEZE_NOW: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/30",
        label: "Freeze Now",
        icon: "🔴",
    },
    ACCA_DEAD: {
        bg: "bg-neutral-500/10",
        text: "text-neutral-500",
        border: "border-neutral-500/30",
        label: "ACCA Dead",
        icon: "❌",
    },
};

// ============ LEG STATUS ICON ============

function LegStatusIcon({ status }: { status: string }) {
    switch (status) {
        case "won":
            return (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                </div>
            );
        case "lost":
            return (
                <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-400" />
                </div>
            );
        default:
            return (
                <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-neutral-500" />
                </div>
            );
    }
}

// ============ SINGLE LEG ROW ============

function LegRow({ leg, index }: { leg: AccaLeg; index: number }) {
    const kickoff = new Date(leg.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
                "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all",
                leg.status === "won" && "bg-emerald-500/5",
                leg.status === "lost" && "bg-red-500/5 opacity-60",
                leg.status === "pending" && "bg-white/[0.02]",
            )}
        >
            <LegStatusIcon status={leg.status} />

            <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white truncate block">
                    {leg.team} Win
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                    {leg.homeTeam} vs {leg.awayTeam}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <span className={cn(
                    "text-sm font-black",
                    leg.isFreezeLeg ? "text-cyan-400" : "text-[#FBBF24]",
                )}>
                    @{leg.odds.toFixed(2)}
                </span>
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    leg.status === "won" ? "text-emerald-400" :
                        leg.status === "lost" ? "text-red-400" :
                            "text-neutral-500"
                )}>
                    {leg.status === "pending" ? kickoff : leg.status.toUpperCase()}
                </span>
            </div>
        </motion.div>
    );
}

// ============ MAIN CARD COMPONENT ============

interface AccaFreezeCardProps {
    acca: AccaFreeze;
    index: number;
    stake?: number;
}

export function AccaFreezeCard({ acca, index, stake = 10 }: AccaFreezeCardProps) {
    const recStyle = RECOMMENDATION_STYLES[acca.freezeRecommendation];

    const safeLegs = acca.legs.filter((l) => !l.isFreezeLeg);
    const freezeLeg = acca.legs.find((l) => l.isFreezeLeg);

    const wonCount = acca.legs.filter((l) => l.status === "won").length;
    const totalLegs = acca.legs.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.15 }}
            className="bg-[#0D1117] rounded-xl overflow-hidden border border-[#1F2937] hover:border-cyan-500/30 transition-all duration-300 shadow-lg"
        >
            {/* ──── Header ──── */}
            <div className="px-5 pt-5 pb-4 border-b border-[#1E293B]/60">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                            <Snowflake className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                ACCA Freeze #{index + 1}
                            </h3>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                5-Fold • Win Only
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#1E293B]">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">
                                Combined
                            </span>
                            <span className="text-lg font-black text-[#FBBF24]">
                                @{acca.combinedOdds.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#161B22] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(wonCount / totalLegs) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500">
                        {wonCount}/{totalLegs}
                    </span>
                </div>
            </div>

            {/* ──── Safe Legs ──── */}
            <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.2em]">
                        Safe Legs
                    </span>
                </div>
                <div className="space-y-1">
                    {safeLegs.map((leg, i) => (
                        <LegRow key={leg.fixtureId} leg={leg} index={i} />
                    ))}
                </div>
            </div>

            {/* ──── Freeze Leg ──── */}
            {freezeLeg && (
                <div className="px-5 pt-2 pb-4">
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.03] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Snowflake className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
                                Freeze Leg
                            </span>
                        </div>
                        <LegRow leg={freezeLeg} index={4} />
                        <p className="text-[10px] text-cyan-400/50 italic mt-2 pl-8">
                            Freeze this selection on SkyBet
                        </p>
                    </div>
                </div>
            )}

            {/* ──── Footer: Payout + Recommendation ──── */}
            <div className="px-5 pb-5">
                {/* Payout row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2.5 rounded-lg bg-[#161B22] border border-[#1E293B]/60">
                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                            Safe Payout
                        </span>
                        <span className="text-sm font-black text-white">
                            £{(stake * acca.safeOddsProduct).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-lg bg-[#161B22] border border-[#1E293B]/60">
                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                            Freeze Value
                        </span>
                        <span className="text-sm font-black text-cyan-400">
                            £{acca.freezeValue.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-lg bg-[#161B22] border border-[#1E293B]/60">
                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                            Full Payout
                        </span>
                        <span className="text-sm font-black text-[#FBBF24]">
                            £{acca.fullPayout.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Recommendation badge */}
                <div className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-lg border",
                    recStyle.bg, recStyle.border,
                )}>
                    <span className="text-sm">{recStyle.icon}</span>
                    <span className={cn("text-xs font-black uppercase tracking-widest", recStyle.text)}>
                        {recStyle.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
