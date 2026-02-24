"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, ShieldAlert, Lock, Target, BarChart3, Zap, Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { MatchAnalysisModal } from "./MatchAnalysisModal";

interface MatchCardProps {
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo: string;
    awayLogo: string;
    leagueName: string;
    prediction: string;
    confidence: number;
    time: string;
    date: string;
    isLive?: boolean;
    isLocked?: boolean;
    // Edge Engine fields
    odds?: number;
    evAdjusted?: number;
    edge?: number;
    edgeScore?: number;
    riskTier?: 'A+' | 'A' | 'B';
    suggestedStake?: number;
    clvProjection?: number;
    simulationWinFreq?: number;
    impliedProbability?: number;
    modelProbability?: number;
    ev?: number;
    confidenceInterval?: [number, number];
}

// Risk tier visual config
const TIER_STYLES = {
    'A+': {
        bg: 'bg-emerald-500/8',
        border: 'border-emerald-400/30 hover:border-emerald-400/60',
        glow: 'shadow-emerald-500/10',
        accent: '#10B981',
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        text: 'text-emerald-400',
    },
    'A': {
        bg: 'bg-amber-500/8',
        border: 'border-amber-400/30 hover:border-amber-400/60',
        glow: 'shadow-amber-500/10',
        accent: '#FBBF24',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        text: 'text-amber-400',
    },
    'B': {
        bg: 'bg-slate-400/8',
        border: 'border-slate-400/20 hover:border-slate-400/40',
        glow: 'shadow-slate-500/10',
        accent: '#94A3B8',
        badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        text: 'text-slate-400',
    },
} as const;

export function MatchCard({
    id,
    homeTeam,
    awayTeam,
    homeLogo,
    awayLogo,
    leagueName,
    prediction,
    confidence,
    time,
    date,
    isLive,
    isLocked,
    odds,
    evAdjusted,
    edge,
    edgeScore = 0,
    riskTier = 'B',
    suggestedStake,
    clvProjection,
    simulationWinFreq,
    impliedProbability,
    modelProbability,
    ev,
}: MatchCardProps) {
    const [homeError, setHomeError] = useState(false);
    const [awayError, setAwayError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bet365Odds, setBet365Odds] = useState<number | null>(odds || null);

    const style = TIER_STYLES[riskTier] || TIER_STYLES['B'];
    const modelProb = modelProbability ?? 0;
    const impliedProb = impliedProbability ?? (odds ? 1 / odds : 0);
    const displayEdge = edge ?? 0;
    const displayEV = ev ?? evAdjusted ?? 0;
    const displayClv = clvProjection ?? 0;
    const displaySimFreq = simulationWinFreq ?? 0;
    const displayStake = suggestedStake ?? 0;

    useEffect(() => {
        if (odds) return;
        const fetchOdds = async () => {
            try {
                const params = new URLSearchParams({
                    fixtureId: String(id),
                    prediction,
                    homeTeam,
                    awayTeam,
                });
                const resp = await fetch(`/api/odds?${params}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.bet365) setBet365Odds(data.bet365);
                }
            } catch {
                // Odds not available
            }
        };
        fetchOdds();
    }, [id, prediction, homeTeam, awayTeam, odds]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "bg-[#0D1117] rounded-xl overflow-hidden border transition-all duration-200 flex flex-col h-full cursor-pointer group/card shadow-lg",
                    style.border,
                    style.glow,
                )}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="p-5 flex-1 flex flex-col">
                    {/* Header Row: Risk Tier + League + Time */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {/* Risk Tier Badge */}
                            <div className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                style.badge,
                            )}>
                                {riskTier === 'A+' ? <Zap className="w-2.5 h-2.5" /> : <Target className="w-2.5 h-2.5" />}
                                {riskTier}
                            </div>

                            {/* Edge Score */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <BarChart3 className="w-2.5 h-2.5 text-white/50" />
                                <span className="text-[10px] font-bold text-white/70">{edgeScore}</span>
                            </div>

                            {isLocked && (
                                <div className="flex items-center px-1.5 py-1 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                                    <Lock className="w-2 h-2" />
                                </div>
                            )}
                        </div>

                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest",
                            isLive ? "bg-red-500 text-white" : "bg-[#161B22] text-neutral-400"
                        )}>
                            {isLive ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Live
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3 h-3" />
                                    {date} • {time}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Teams Section */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 mb-5 pb-5 border-b border-[#1E293B]/60">
                        {/* Home Team */}
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1E293B] overflow-hidden">
                                {!homeError && homeLogo ? (
                                    <img
                                        src={homeLogo}
                                        alt={homeTeam}
                                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain p-1"
                                        onError={() => setHomeError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-5 h-5 text-neutral-600" />
                                )}
                            </div>
                            <div className="min-h-[2.5rem] flex items-start justify-center w-full">
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight [text-wrap:balance]">
                                    {homeTeam}
                                </h3>
                            </div>
                        </div>

                        {/* VS */}
                        <div className="flex items-center justify-center h-14 sm:h-16 lg:h-20 px-2">
                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">VS</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1E293B] overflow-hidden">
                                {!awayError && awayLogo ? (
                                    <img
                                        src={awayLogo}
                                        alt={awayTeam}
                                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain p-1"
                                        onError={() => setAwayError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-5 h-5 text-neutral-600" />
                                )}
                            </div>
                            <div className="min-h-[2.5rem] flex items-start justify-center w-full">
                                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight [text-wrap:balance]">
                                    {awayTeam}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Market + Odds Row */}
                    <div className="flex items-end justify-between mb-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
                                Signal
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white uppercase leading-snug max-w-[200px] sm:max-w-[240px]">
                                {prediction}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
                                Odds
                            </span>
                            <div className={cn("text-xl sm:text-2xl font-black", style.text)}>
                                {bet365Odds ? `@${bet365Odds.toFixed(2)}` : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid — Institutional Data Panel */}
                    <div className="mt-auto space-y-3">
                        {/* Row 1: Model Prob | Implied Prob | Edge % */}
                        <div className="grid grid-cols-3 gap-2">
                            <MetricCell label="Model Prob" value={`${(modelProb * 100).toFixed(1)}%`} />
                            <MetricCell label="Implied" value={`${(impliedProb * 100).toFixed(1)}%`} />
                            <MetricCell label="Edge" value={`+${(displayEdge * 100).toFixed(1)}%`} highlight />
                        </div>

                        {/* Row 2: EV | CLV Proj | Sim Freq */}
                        <div className="grid grid-cols-3 gap-2">
                            <MetricCell label="EV" value={`+${(displayEV * 100).toFixed(1)}%`} highlight />
                            <MetricCell label="CLV Proj" value={`${displayClv > 0 ? '+' : ''}${displayClv.toFixed(1)}%`} />
                            <MetricCell label="Sim Win" value={`${(displaySimFreq / 100).toFixed(0)}%`} />
                        </div>

                        {/* Row 3: Risk | Stake | Confidence */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className={cn(
                                "flex flex-col items-center p-2 rounded-lg border",
                                style.bg,
                                riskTier === 'A+' ? 'border-emerald-500/20' : riskTier === 'A' ? 'border-amber-500/20' : 'border-slate-500/20',
                            )}>
                                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Risk</span>
                                <span className={cn("text-sm font-black", style.text)}>{riskTier}</span>
                            </div>
                            <MetricCell label="Stake" value={`${(displayStake * 100).toFixed(1)}%`} />
                            <MetricCell label="Conf" value={`${confidence}%`} />
                        </div>

                        {/* Full Analysis Button */}
                        <div className={cn(
                            "w-full py-3 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 border",
                            "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20",
                        )}>
                            Full Analysis
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </motion.div>

            <MatchAnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fixtureId={id}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
                leagueName={leagueName}
                prediction={prediction}
                date={date}
                time={time}
            />
        </>
    );
}

// ============ METRIC CELL COMPONENT ============

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center p-2 rounded-lg bg-[#161B22] border border-[#1E293B]/60">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                highlight ? "text-emerald-400" : "text-white/90",
            )}>
                {value}
            </span>
        </div>
    );
}
