"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, Info, Zap, Target, BarChart3, Trophy, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ============ TYPES ============

interface AnalysisMarket {
    id: string;
    label: string;
    probability: number;
    confidence: "Low" | "Medium" | "High";
    odds: number | null;
    bookmaker: string | null;
    edge: number;
    ev: number;
    isValue: boolean;
    reasoning: string;
    tier: string;
    correctScoreline?: string;
}

interface AnalysisData {
    markets: AnalysisMarket[];
    topPick: AnalysisMarket | null;
    summary: {
        confidence: number;
        insightText: string;
        lambdaHome: number;
        lambdaAway: number;
        predictedScore: string;
    };
    signals: {
        name: string;
        value: number;
        rating: string;
        explanation: string;
        tooltip: string;
    }[];
    meta: {
        generatedAt: string;
        dataSource: string;
        fixtureId: number;
    };
}

interface MatchAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string;
    awayLogo?: string;
    leagueName?: string;
    prediction?: string;
    date?: string;
    time?: string;
}

// ============ TAB DEFINITIONS ============

type TabKey = "goals" | "result" | "btts" | "halftime" | "scores";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "goals", label: "Goals", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: "result", label: "Result", icon: <Target className="w-3.5 h-3.5" /> },
    { key: "btts", label: "BTTS", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "halftime", label: "1st Half", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: "scores", label: "Scores", icon: <Trophy className="w-3.5 h-3.5" /> },
];

function categorise(markets: AnalysisMarket[]): Record<TabKey, AnalysisMarket[]> {
    return {
        goals: markets.filter(m => !m.correctScoreline && ["over_2.5", "over_3.5", "under_1.5", "under_2.5"].includes(m.id)),
        result: markets.filter(m => !m.correctScoreline && (m.id.startsWith("result_") || m.id.startsWith("btts_home") || m.id.startsWith("btts_away"))),
        btts: markets.filter(m => !m.correctScoreline && (m.id === "btts" || m.id === "btts_no" || m.id.includes("btts_over") || m.id.includes("btts_under"))),
        halftime: markets.filter(m => !m.correctScoreline && m.id.startsWith("1h_")),
        scores: markets.filter(m => !!m.correctScoreline),
    };
}

// ============ CONFIDENCE GAUGE ============

function ConfidenceGauge({ value, size = 120 }: { value: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;
    const color = value >= 70 ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";

    return (
        <div className="relative flex items-center justify-center rounded-full bg-[#0B0F14]" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1F2937" strokeWidth={6} />
                <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white tabular-nums tracking-tighter leading-none">{value}%</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] mt-0.5" style={{ color }}>Confidence</span>
            </div>
        </div>
    );
}

// ============ BEST VERDICT CARD ============

function BestVerdictCard({ pick }: { pick: AnalysisMarket }) {
    const edgePct = (pick.edge * 100).toFixed(1);
    const hasPositiveEdge = pick.edge > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-5 md:mx-10 mt-5 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
        >
            {/* Header strip */}
            <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Best Verdict</span>
                <div className="h-[1px] flex-1 bg-emerald-500/20" />
                <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">Engine Recommendation</span>
            </div>

            {/* Body */}
            <div className="bg-[#0A1F15]/60 px-5 py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Market label */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-10 rounded-full bg-emerald-500 flex-shrink-0" />
                        <div>
                            <span className="block text-[11px] font-bold text-emerald-400/70 uppercase tracking-widest mb-0.5">Bet</span>
                            <span className="text-lg md:text-xl font-black text-white tracking-tight leading-tight">{pick.label}</span>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Probability */}
                        <div className="text-center">
                            <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Prob</span>
                            <span className="text-2xl font-black text-emerald-400 tabular-nums">{pick.probability}%</span>
                        </div>
                        <div className="w-[1px] h-10 bg-[#1F2937]" />
                        {/* Odds */}
                        {pick.odds && (
                            <div className="text-center">
                                <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Odds</span>
                                <span className="text-2xl font-black text-white tabular-nums">{pick.odds.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="w-[1px] h-10 bg-[#1F2937]" />
                        {/* Edge */}
                        <div className="text-center">
                            <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Edge</span>
                            <span className={cn(
                                "text-2xl font-black tabular-nums",
                                hasPositiveEdge ? "text-emerald-400" : "text-neutral-400"
                            )}>
                                {hasPositiveEdge ? "+" : ""}{edgePct}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Reasoning */}
                <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-emerald-300/70 leading-relaxed">{pick.reasoning}</p>
                </div>
                {pick.bookmaker && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Best odds at:</span>
                        <span className="text-[9px] font-bold text-neutral-400">{pick.bookmaker}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============ TAB STRIP ============

function TabStrip({ active, onChange, tabs, categorised }: {
    active: TabKey;
    onChange: (k: TabKey) => void;
    tabs: typeof TABS;
    categorised: Record<TabKey, AnalysisMarket[]>;
}) {
    return (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 px-5 md:px-10">
            {tabs.map(tab => {
                const count = categorised[tab.key].length;
                const isActive = active === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200 flex-shrink-0",
                            isActive
                                ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                                : "bg-[#111827] text-neutral-500 border border-[#1F2937] hover:text-neutral-300 hover:border-[#374151]"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {count > 0 && (
                            <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded-full",
                                isActive ? "bg-amber-400/20 text-amber-400" : "bg-[#1F2937] text-neutral-500"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ============ MARKET ROW (compact, scannable) ============

function MarketRow({ market, index }: { market: AnalysisMarket; index: number }) {
    const edgePct = (market.edge * 100).toFixed(1);
    const isValue = market.isValue;
    const probColor = market.probability >= 65 ? "text-emerald-400" :
        market.probability >= 55 ? "text-amber-400" : "text-neutral-400";
    const barColor = market.probability >= 65 ? "bg-emerald-500" :
        market.probability >= 55 ? "bg-amber-500" : "bg-rose-500/60";

    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
                isValue
                    ? "bg-[#0A1F15]/50 border-emerald-500/25 hover:border-emerald-500/40"
                    : "bg-[#111827] border-[#1F2937] hover:border-[#374151]"
            )}
        >
            {/* Left: Label + probability bar */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white truncate">{market.label}</span>
                    {isValue && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                            Value
                        </span>
                    )}
                </div>
                {/* Probability bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[#0B0F14] rounded-full overflow-hidden max-w-[160px]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, market.probability)}%` }}
                            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 + index * 0.04 }}
                            className={cn("h-full rounded-full", barColor)}
                        />
                    </div>
                    <span className={cn("text-xs font-black tabular-nums", probColor)}>
                        {market.probability}%
                    </span>
                </div>
                {/* Reasoning — small */}
                <p className="text-[9px] font-medium text-neutral-600 mt-1 leading-tight line-clamp-1 italic">
                    {market.reasoning}
                </p>
            </div>

            {/* Right: Odds + Edge — fixed width column */}
            <div className="flex-shrink-0 text-right w-[72px] border-l border-[#1F2937] pl-3">
                {market.odds ? (
                    <>
                        <span className={cn(
                            "block text-base font-black tabular-nums",
                            isValue ? "text-emerald-400" : "text-white"
                        )}>
                            {market.odds.toFixed(2)}
                        </span>
                        <span className={cn(
                            "block text-[9px] font-bold",
                            market.edge > 0 ? "text-emerald-400" : "text-neutral-600"
                        )}>
                            {market.edge > 0 ? "+" : ""}{edgePct}%
                        </span>
                        <span className="block text-[8px] text-neutral-600 truncate max-w-full">
                            {market.bookmaker}
                        </span>
                    </>
                ) : (
                    <span className="text-[9px] font-black text-neutral-700 uppercase tracking-wider">N/A</span>
                )}
            </div>
        </motion.div>
    );
}

// ============ CORRECT SCORE ROW ============

function CorrectScoreRow({ market, index }: { market: AnalysisMarket; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-purple-500/30 transition-colors"
        >
            <div className="flex-1">
                <span className="text-xl font-black text-white tabular-nums">{market.correctScoreline}</span>
                <span className="block text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">Poisson estimate</span>
            </div>
            <div className="text-right flex-shrink-0 w-[72px] border-l border-[#1F2937] pl-3">
                <span className="block text-base font-black text-purple-400 tabular-nums">{market.probability}%</span>
                {market.odds && (
                    <span className="block text-[9px] font-bold text-white">{market.odds.toFixed(2)}</span>
                )}
            </div>
        </motion.div>
    );
}

// ============ SIGNAL CHIP ============

function SignalChip({ signal }: { signal: AnalysisData["signals"][0] }) {
    const [tip, setTip] = useState(false);
    const color = signal.value >= 70 ? "text-emerald-400" : signal.value >= 50 ? "text-amber-400" : "text-rose-400";
    const barColor = signal.value >= 70 ? "bg-emerald-500" : signal.value >= 50 ? "bg-amber-500" : "bg-rose-500";

    return (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest truncate">{signal.name}</span>
                <button
                    className="relative flex-shrink-0"
                    onMouseEnter={() => setTip(true)}
                    onMouseLeave={() => setTip(false)}
                    onClick={() => setTip(!tip)}
                >
                    <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400" />
                    <AnimatePresence>
                        {tip && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute z-50 right-0 top-5 w-52 p-3 bg-[#0D1117] border border-[#374151] rounded-lg shadow-xl text-left"
                            >
                                <p className="text-[10px] text-neutral-300 leading-relaxed">{signal.tooltip}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
                <span className={cn("text-2xl font-black tabular-nums", color)}>{signal.value}</span>
                <span className="text-[9px] font-bold text-neutral-600">/100</span>
            </div>
            <div className="h-1 w-full bg-[#0B0F14] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }} animate={{ width: `${signal.value}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={cn("h-full rounded-full", barColor)}
                />
            </div>
        </div>
    );
}

// ============ EMPTY TAB STATE ============

function EmptyTab({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F2937] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-neutral-600" />
            </div>
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">No {label} data</span>
        </div>
    );
}

// ============ MAIN MODAL ============

export function MatchAnalysisModal({
    isOpen, onClose, fixtureId,
    homeTeam, awayTeam, homeLogo, awayLogo,
    leagueName, prediction, date, time
}: MatchAnalysisModalProps) {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("goals");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setIsLoading(true);
            setError(null);
            setData(null);
            setActiveTab("goals");
            const params = new URLSearchParams({ fixtureId: String(fixtureId), homeTeam, awayTeam });
            fetch(`/api/analysis?${params}`)
                .then(r => {
                    if (!r.ok) throw new Error(r.status === 401 ? "Please sign in to view analysis." : "Analysis temporarily unavailable.");
                    return r.json();
                })
                .then(d => { setData(d); setIsLoading(false); })
                .catch((e) => { setError(e.message || "Analysis unavailable."); setIsLoading(false); });
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen, fixtureId, homeTeam, awayTeam]);

    if (!mounted) return null;

    const categorised = categorise(data?.markets ?? []);

    // Auto-select first tab with data when data loads
    const tabsWithData = TABS.filter(t => categorised[t.key].length > 0);

    const modalContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-2xl h-[100dvh] md:h-auto md:max-h-[92vh] bg-[#0B0F14] border-0 md:border md:border-[#1F2937] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            aria-label="Close match analysis"
                            className="absolute top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center rounded-lg bg-[#111827]/90 backdrop-blur-sm border border-[#1F2937] text-neutral-400 hover:text-white hover:bg-[#1F2937] active:scale-95 transition-all duration-150"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">

                            {/* ═══ HEADER ═══ */}
                            <div className="border-b border-[#1F2937] bg-gradient-to-b from-[#111827]/80 to-[#0B0F14]">
                                <div className="px-5 pt-14 pb-5 md:px-10 md:pt-8 md:pb-6">
                                    {/* League badge */}
                                    {leagueName && (
                                        <div className="flex justify-center mb-4">
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#1F2937] bg-[#111827]">
                                                {leagueName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Home */}
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#111827] rounded-xl p-2 border border-[#1F2937]">
                                                <Image src={homeLogo || ""} alt={homeTeam} width={64} height={64} className="w-full h-full object-contain" />
                                            </div>
                                            <h2 className="text-sm font-bold text-white text-center line-clamp-2 max-w-[90px] md:max-w-[120px]">{homeTeam}</h2>
                                        </div>

                                        {/* Center */}
                                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                            {data?.summary && <ConfidenceGauge value={data.summary.confidence} size={100} />}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">KO</span>
                                                    <span className="text-xs font-bold text-white tabular-nums">{time || "—"}</span>
                                                </div>
                                                {data?.summary && (
                                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Predicted: </span>
                                                        <span className="text-[9px] font-black text-white">{data.summary.predictedScore}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Away */}
                                        <div className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#111827] rounded-xl p-2 border border-[#1F2937]">
                                                <Image src={awayLogo || ""} alt={awayTeam} width={64} height={64} className="w-full h-full object-contain" />
                                            </div>
                                            <h2 className="text-sm font-bold text-white text-center line-clamp-2 max-w-[90px] md:max-w-[120px]">{awayTeam}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ LOADING / ERROR ═══ */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="relative">
                                        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                                        <div className="absolute inset-0 w-10 h-10 rounded-full bg-amber-400/10 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Running Engine Pipeline...</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                                        <X className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-400 text-center max-w-xs px-6">{error}</span>
                                </div>
                            )}

                            {data && !isLoading && !error && (
                                <>
                                    {/* ═══ BEST VERDICT ═══ */}
                                    {data.topPick && <BestVerdictCard pick={data.topPick} />}

                                    {/* ═══ AI INSIGHT ═══ */}
                                    {data.summary?.insightText && (
                                        <div className="px-5 md:px-10 py-4 mt-4 border-b border-[#1F2937] bg-[#111827]/40">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.15em] mb-1">AI Quantitative Insight</h4>
                                                    <p className="text-[11px] md:text-xs font-medium text-neutral-300 leading-relaxed">{data.summary.insightText}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══ MARKET BREAKDOWN ═══ */}
                                    <div className="pt-5 space-y-4">
                                        {/* Section header */}
                                        <div className="flex items-center gap-3 px-5 md:px-10">
                                            <BarChart3 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Market Breakdown</h3>
                                            <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                            <span className="text-[9px] font-bold text-neutral-600 tabular-nums">{data.markets.length} markets</span>
                                        </div>

                                        {/* Tab strip */}
                                        <TabStrip
                                            active={activeTab}
                                            onChange={setActiveTab}
                                            tabs={TABS}
                                            categorised={categorised}
                                        />

                                        {/* Tab content */}
                                        <div className="px-5 md:px-10 pb-2">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="space-y-2"
                                                >
                                                    {activeTab !== "scores" ? (
                                                        categorised[activeTab].length > 0
                                                            ? categorised[activeTab].map((m, i) => <MarketRow key={m.id} market={m} index={i} />)
                                                            : <EmptyTab label={TABS.find(t => t.key === activeTab)?.label || activeTab} />
                                                    ) : (
                                                        categorised.scores.length > 0
                                                            ? categorised.scores.map((m, i) => <CorrectScoreRow key={m.id} market={m} index={i} />)
                                                            : <EmptyTab label="Score" />
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* ═══ MODEL SIGNALS ═══ */}
                                    {data.signals.length > 0 && (
                                        <div className="px-5 md:px-10 pt-6 pb-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Model Signals</h3>
                                                <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {data.signals.map((s, i) => <SignalChip key={i} signal={s} />)}
                                            </div>
                                        </div>
                                    )}

                                    {/* ═══ FOOTER ═══ */}
                                    <div className="px-5 md:px-10 pt-2 pb-8 space-y-4">
                                        <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] text-center">
                                            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.15em] leading-relaxed max-w-lg mx-auto">
                                                PitchPulse AI uses quantitative modelling. Projections are probabilistic and for informational purposes only.
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <button
                                                onClick={onClose}
                                                className="px-10 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-[#1F2937] hover:border-[#374151] active:scale-95"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
