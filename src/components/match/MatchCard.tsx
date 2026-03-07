"use client";

import { motion } from "framer-motion";
import { Clock, ShieldAlert, Lock, Target, BarChart3, Zap, Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MatchAnalysisModal = dynamic(
    () => import("./MatchAnalysisModal").then(m => ({ default: m.MatchAnalysisModal })),
    { ssr: false }
);

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
        border: 'border-emerald-500/30 hover:border-emerald-400/60',
        leftBar: 'bg-emerald-400',
        glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]',
        accent: '#10B981',
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        text: 'text-emerald-400',
        oddsGlow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        barColor: 'bg-emerald-500',
        riskBg: 'bg-emerald-500/10 border-emerald-500/20',
        metricTop: 'border-t-emerald-500/60',
    },
    'A': {
        border: 'border-amber-500/30 hover:border-amber-400/60',
        leftBar: 'bg-amber-400',
        glow: 'hover:shadow-[0_8px_30px_rgba(251,191,36,0.12)]',
        accent: '#FBBF24',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        text: 'text-amber-400',
        oddsGlow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
        barColor: 'bg-amber-500',
        riskBg: 'bg-amber-500/10 border-amber-500/20',
        metricTop: 'border-t-amber-500/60',
    },
    'B': {
        border: 'border-slate-500/20 hover:border-slate-400/40',
        leftBar: 'bg-slate-500',
        glow: 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        accent: '#94A3B8',
        badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        text: 'text-slate-400',
        oddsGlow: '',
        barColor: 'bg-slate-500',
        riskBg: 'bg-slate-500/10 border-slate-500/20',
        metricTop: 'border-t-slate-500/40',
    },
} as const;

const ROW_VARIANTS = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const ROW_ITEM = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function MatchCard({
    id, homeTeam, awayTeam, homeLogo, awayLogo,
    leagueName, prediction, confidence, time, date,
    isLive, isLocked,
    odds, evAdjusted, edge, edgeScore = 0,
    riskTier = 'B', suggestedStake, clvProjection,
    simulationWinFreq, impliedProbability, modelProbability, ev,
}: MatchCardProps) {
    const [homeError, setHomeError] = useState(false);
    const [awayError, setAwayError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lockTip, setLockTip] = useState(false);
    const [displayOdds, setDisplayOdds] = useState<number | null>(odds || null);

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
                const params = new URLSearchParams({ fixtureId: String(id), prediction, homeTeam, awayTeam });
                const resp = await fetch(`/api/odds?${params}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.bet365) setDisplayOdds(data.bet365);
                }
            } catch { /* Odds not available */ }
        };
        fetchOdds();
    }, [id, prediction, homeTeam, awayTeam, odds]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
                className={cn(
                    "relative bg-[#0D1117] rounded-xl overflow-hidden border transition-all duration-200 flex flex-col h-full cursor-pointer shadow-lg",
                    style.border,
                    style.glow,
                )}
                onClick={() => setIsModalOpen(true)}
            >
                {/* Tier accent — left edge bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl z-10", style.leftBar)} />

                <div className="pl-5 pr-5 pt-4 pb-5 flex-1 flex flex-col">

                    {/* ── ROW 1: League pill + Time/Live ── */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {/* League pill */}
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-[0.18em] bg-[#161B22] border border-[#1E293B] px-2 py-0.5 rounded-md">
                                {leagueName}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Risk badge */}
                            <div className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                style.badge,
                            )}>
                                {riskTier === 'A+' ? <Zap className="w-2.5 h-2.5" /> : <Target className="w-2.5 h-2.5" />}
                                {riskTier}
                            </div>

                            {/* Edge score */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <BarChart3 className="w-2.5 h-2.5 text-white/40" />
                                <span className="text-[10px] font-bold text-white/60">{edgeScore}</span>
                            </div>

                            {/* Lock icon with tooltip */}
                            {isLocked && (
                                <div className="relative" onMouseEnter={() => setLockTip(true)} onMouseLeave={() => setLockTip(false)}>
                                    <div className="flex items-center px-1.5 py-1 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                                        <Lock className="w-2 h-2" />
                                    </div>
                                    {lockTip && (
                                        <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#0D1117] border border-[#1F2937] rounded-lg p-2.5 shadow-xl z-50">
                                            <p className="text-[9px] font-medium text-neutral-300 leading-relaxed">
                                                Prediction locked — result will be tracked in History
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── ROW 2: Date / Live ── */}
                    <div className="flex justify-end mb-4">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest",
                            isLive ? "bg-red-500/90 text-white" : "bg-[#161B22] text-neutral-500 border border-[#1E293B]"
                        )}>
                            {isLive ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Live
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3 h-3" />
                                    {date} · {time}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── ROW 3: Teams ── */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-5 pb-5 border-b border-[#1E293B]/50">
                        {/* Home */}
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                {!homeError && homeLogo ? (
                                    <img
                                        src={homeLogo} alt={homeTeam}
                                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                        onError={() => setHomeError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-8 h-8 text-neutral-700" />
                                )}
                            </div>
                            <h3 className="text-sm font-black text-white tracking-tight leading-tight [text-wrap:balance] min-h-[2.5rem] flex items-start justify-center">
                                {homeTeam}
                            </h3>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center gap-0.5 px-1">
                            <Activity className="w-3 h-3 text-neutral-700 mb-0.5" />
                            <span className="text-[9px] font-black text-neutral-700 uppercase tracking-widest">vs</span>
                        </div>

                        {/* Away */}
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                {!awayError && awayLogo ? (
                                    <img
                                        src={awayLogo} alt={awayTeam}
                                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                                        onError={() => setAwayError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-8 h-8 text-neutral-700" />
                                )}
                            </div>
                            <h3 className="text-sm font-black text-white tracking-tight leading-tight [text-wrap:balance] min-h-[2.5rem] flex items-start justify-center">
                                {awayTeam}
                            </h3>
                        </div>
                    </div>

                    {/* ── ROW 4: Signal + Odds ── */}
                    <div className="flex items-end justify-between mb-5">
                        <div className="flex flex-col gap-1 min-w-0 mr-3">
                            <span className="text-[8px] font-semibold text-neutral-500 tracking-widest uppercase">Signal</span>
                            <span className="text-xs sm:text-sm font-bold text-white uppercase leading-snug max-w-[180px]">
                                {prediction}
                            </span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[8px] font-semibold text-neutral-500 tracking-widest uppercase mb-0.5">Odds</span>
                            <span className={cn(
                                "text-3xl font-black tabular-nums leading-none",
                                style.text,
                                style.oddsGlow,
                            )}>
                                {displayOdds ? displayOdds.toFixed(2) : "—"}
                            </span>
                        </div>
                    </div>

                    {/* ── METRICS GRID — staggered reveal ── */}
                    <div className="mt-auto">
                        <motion.div
                            className="space-y-2"
                            variants={ROW_VARIANTS}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Row 1 */}
                            <motion.div variants={ROW_ITEM} className="grid grid-cols-3 gap-2">
                                <MetricCell label="Model Prob" value={`${(modelProb * 100).toFixed(1)}%`} />
                                <MetricCell label="Implied" value={`${(impliedProb * 100).toFixed(1)}%`} />
                                <MetricCell label="Edge" value={`+${(displayEdge * 100).toFixed(1)}%`} highlight accentClass={style.metricTop} />
                            </motion.div>

                            {/* Row 2 */}
                            <motion.div variants={ROW_ITEM} className="grid grid-cols-3 gap-2">
                                <MetricCell label="EV" value={`+${(displayEV * 100).toFixed(1)}%`} highlight accentClass={style.metricTop} />
                                <MetricCell label="CLV Proj" value={`${displayClv > 0 ? '+' : ''}${displayClv.toFixed(1)}%`} />
                                <MetricCell label="Sim Win" value={`${(displaySimFreq / 100).toFixed(0)}%`} />
                            </motion.div>

                            {/* Row 3: Risk | Stake | Confidence bar */}
                            <motion.div variants={ROW_ITEM} className="grid grid-cols-3 gap-2">
                                {/* Risk */}
                                <div className={cn(
                                    "flex flex-col items-center p-2 rounded-lg border",
                                    style.riskBg
                                )}>
                                    <span className="text-[8px] font-semibold text-neutral-500 tracking-widest">Risk</span>
                                    <span className={cn("text-sm font-black", style.text)}>{riskTier}</span>
                                </div>

                                {/* Stake */}
                                <MetricCell label="Stake" value={`${(displayStake * 100).toFixed(1)}%`} />

                                {/* Confidence — bar version */}
                                <div className="flex flex-col items-center p-2 rounded-lg bg-[#161B22] border border-[#1E293B]/60 gap-1.5">
                                    <span className="text-[8px] font-semibold text-neutral-500 tracking-widest">Conf</span>
                                    <span className="text-sm font-bold text-white/90">{confidence}%</span>
                                    <div className="w-full h-1 bg-[#0B0F14] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${confidence}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                                            className={cn("h-full rounded-full", style.barColor)}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Full Analysis Button */}
                        <motion.div
                            variants={ROW_ITEM}
                            className="group/btn mt-3 w-full py-3 rounded-lg text-[11px] font-bold text-white/70 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-white/4 hover:bg-white/8"
                        >
                            Full Analysis
                            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 duration-150" />
                        </motion.div>
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

// ============ METRIC CELL ============

function MetricCell({
    label, value, highlight, accentClass,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    accentClass?: string;
}) {
    return (
        <div className={cn(
            "flex flex-col items-center p-2 rounded-lg bg-[#161B22] border border-[#1E293B]/60 border-t-2",
            highlight && accentClass ? accentClass : "border-t-transparent",
        )}>
            <span className="text-[8px] font-semibold text-neutral-500 tracking-widest mb-0.5">{label}</span>
            <span className={cn(
                "text-sm font-bold tabular-nums",
                highlight ? "text-emerald-400" : "text-white/90",
            )}>
                {value}
            </span>
        </div>
    );
}
