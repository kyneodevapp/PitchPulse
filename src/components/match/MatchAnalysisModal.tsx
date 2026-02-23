"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, TrendingUp, ChevronDown, Info, Lock, Zap, Target, BarChart3, Trophy } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { Paywall } from "./Paywall";
import { useRouter } from "next/navigation";

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

// ============ CONFIDENCE GAUGE (SVG Ring) ============

function ConfidenceGauge({ value, size = 120 }: { value: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / 100) * circumference;
    const color = value >= 70 ? "#10B981" : value >= 50 ? "#F59E0B" : "#EF4444";
    const glowColor = value >= 70 ? "rgba(16,185,129,0.15)" : value >= 50 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Track */}
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="#1F2937" strokeWidth={6} />
                {/* Progress */}
                <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: glowColor, borderRadius: '50%' }}>
                <span className="text-2xl md:text-3xl font-bold text-white tabular-nums tracking-tighter">
                    {value}%
                </span>
                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5"
                    style={{ color }}>
                    Model Confidence
                </span>
            </div>
        </div>
    );
}

// ============ COLLAPSIBLE TAB ============

function MarketTab({
    title, icon, count, defaultOpen, children,
}: {
    title: string; icon: React.ReactNode; count: number;
    defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

    if (count === 0) return null;

    return (
        <div className="border border-[#1F2937] rounded-xl overflow-hidden bg-[#0D1117]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-5 py-4 transition-colors",
                    isOpen ? "bg-[#111827]" : "hover:bg-[#111827]/50"
                )}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-xs font-bold text-white uppercase tracking-[0.15em]">{title}</span>
                    <span className="text-[10px] font-bold text-neutral-500 bg-[#1F2937] px-2 py-0.5 rounded">
                        {count}
                    </span>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-3 border-t border-[#1F2937]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============ MARKET CARD ============

function MarketCard({ market, index }: { market: AnalysisMarket; index: number }) {
    const edgePct = (market.edge * 100).toFixed(1);
    const isValue = market.isValue;
    const probColor = market.probability >= 65 ? "text-emerald-400" :
        market.probability >= 55 ? "text-amber-400" : "text-neutral-400";

    const confBadgeColor = market.confidence === "High" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
        market.confidence === "Medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
            "bg-red-500/15 text-red-400 border-red-500/30";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "relative bg-[#111827] rounded-xl p-4 md:p-5 border transition-all duration-300 group",
                isValue
                    ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                    : "border-[#1F2937] hover:border-[#374151]"
            )}
        >
            {/* Value Tag */}
            {isValue && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Value</span>
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                {/* LEFT: Market Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{market.label}</span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", confBadgeColor)}>
                            {market.confidence}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                        <div>
                            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest block">Probability</span>
                            <span className={cn("text-lg font-bold tabular-nums", probColor)}>
                                {market.probability}%
                            </span>
                        </div>
                        {/* Probability Bar */}
                        <div className="flex-1 max-w-32">
                            <div className="h-1.5 w-full bg-[#0B0F14] rounded-full overflow-hidden border border-[#1F2937]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, market.probability)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 + index * 0.05 }}
                                    className={cn(
                                        "h-full rounded-full",
                                        market.probability >= 65 ? "bg-emerald-500" :
                                            market.probability >= 55 ? "bg-amber-500" : "bg-rose-500"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Odds & Edge */}
                <div className="text-right flex-shrink-0 min-w-[90px]">
                    {market.odds ? (
                        <>
                            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest block">Best Odds</span>
                            <span className={cn(
                                "text-xl font-bold tabular-nums block",
                                isValue ? "text-emerald-400" : "text-white"
                            )}>
                                {market.odds.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-medium text-neutral-500 block truncate">
                                {market.bookmaker}
                            </span>
                            <span className={cn(
                                "text-[10px] font-bold mt-1 inline-block",
                                isValue ? "text-emerald-400" : market.edge > 0 ? "text-amber-400" : "text-neutral-600"
                            )}>
                                {market.edge > 0 ? `+${edgePct}%` : `${edgePct}%`} edge
                            </span>
                        </>
                    ) : (
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                            Odds N/A
                        </span>
                    )}
                </div>
            </div>

            {/* Reasoning */}
            <div className="mt-3 pt-3 border-t border-[#1F2937]/50">
                <p className="text-[11px] font-medium text-neutral-500 leading-relaxed italic">
                    {market.reasoning}
                </p>
            </div>
        </motion.div>
    );
}

// ============ SIGNAL CARD WITH TOOLTIP ============

function SignalCard({ signal }: { signal: AnalysisData['signals'][0] }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:bg-[#1C2533] transition-colors group relative">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    {signal.name}
                </span>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase",
                        signal.rating === "High" || signal.rating === "Elite" ? "text-emerald-400 bg-emerald-400/10" :
                            signal.rating === "Medium" ? "text-amber-400 bg-amber-400/10" : "text-rose-400 bg-red-400/10"
                    )}>
                        {signal.rating}
                    </span>
                    <button
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        onClick={() => setShowTooltip(!showTooltip)}
                    >
                        <Info className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-400 transition-colors" />
                        <AnimatePresence>
                            {showTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute z-50 right-0 top-6 w-56 p-3 bg-[#0D1117] border border-[#374151] rounded-lg shadow-xl"
                                >
                                    <p className="text-[10px] font-medium text-neutral-300 leading-relaxed">
                                        {signal.tooltip}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
            <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-white tabular-nums">{signal.value}</span>
                <span className="text-[10px] font-bold text-neutral-600 mb-1">/ 100</span>
            </div>
            {/* Signal Bar */}
            <div className="h-1 w-full bg-[#0B0F14] rounded-full overflow-hidden mb-2">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${signal.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                        "h-full rounded-full",
                        signal.value >= 70 ? "bg-emerald-500" :
                            signal.value >= 50 ? "bg-amber-500" : "bg-rose-500"
                    )}
                />
            </div>
            <p className="text-[10px] font-medium text-neutral-500 leading-relaxed">
                {signal.explanation}
            </p>
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
    const [mounted, setMounted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { isTrialExpired } = useSubscription();

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setIsLoading(true);
            const params = new URLSearchParams({
                fixtureId: String(fixtureId),
                homeTeam, awayTeam,
            });
            fetch(`/api/analysis?${params}`)
                .then(r => r.json())
                .then(d => { setData(d); setIsLoading(false); })
                .catch(() => setIsLoading(false));
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen, fixtureId, homeTeam, awayTeam]);

    if (!mounted) return null;

    // Categorize markets
    const highProb = data?.markets.filter(m => m.probability >= 65 && !m.correctScoreline) || [];
    const mediumEdge = data?.markets.filter(m => m.probability >= 55 && m.probability < 65 && !m.correctScoreline) || [];
    const valuePlays = data?.markets.filter(m => m.isValue && m.probability < 65 && !m.correctScoreline) || [];
    const correctScores = data?.markets.filter(m => m.correctScoreline) || [];

    // Also add non-value, lower prob markets that aren't covered above
    const remainingMarkets = data?.markets.filter(m =>
        !m.correctScoreline &&
        m.probability < 55 &&
        !m.isValue
    ) || [];

    // Merge remaining into medium edge for display
    const mediumAll = [...mediumEdge, ...remainingMarkets.filter(m => m.probability >= 45)];

    const modalContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-4xl h-[calc(100dvh-0.5rem)] md:h-auto md:max-h-[92vh] bg-[#0B0F14] border border-[#1F2937] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Close */}
                        <button onClick={onClose}
                            className="absolute top-3 right-3 md:top-5 md:right-5 p-2 rounded-lg bg-[#111827]/80 hover:bg-[#1F2937] text-white transition-all border border-[#1F2937] z-[60] backdrop-blur-sm">
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                            {/* ═══════ HEADER ═══════ */}
                            <div className="border-b border-[#1F2937] bg-gradient-to-b from-[#111827]/80 to-[#0B0F14]">
                                <div className="p-5 pt-12 md:p-10 md:pt-10">
                                    {/* League Badge */}
                                    {leagueName && (
                                        <div className="flex justify-center mb-5">
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#1F2937] bg-[#111827]">
                                                {leagueName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between gap-3 md:gap-8">
                                        {/* Home Team */}
                                        <div className="flex-1 flex flex-col items-center gap-2 md:gap-3">
                                            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#111827] rounded-xl p-2 md:p-4 border border-[#1F2937] shadow-lg">
                                                <img src={homeLogo} alt={homeTeam} className="w-full h-full object-contain" />
                                            </div>
                                            <h2 className="text-xs md:text-base font-bold text-white tracking-tight text-center max-w-[100px] md:max-w-none line-clamp-2">
                                                {homeTeam}
                                            </h2>
                                        </div>

                                        {/* Center: VS + Kickoff */}
                                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                            <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-[10px] md:text-xs font-bold text-neutral-400 tracking-widest uppercase">
                                                VS
                                            </div>
                                            <div className="flex items-center gap-1 bg-[#111827] px-3 py-1 rounded-lg border border-[#1F2937]">
                                                <span className="text-[9px] md:text-[10px] font-bold text-amber-400 uppercase tracking-wider">KO</span>
                                                <span className="text-[10px] md:text-xs font-bold text-white tabular-nums">{time || "—"}</span>
                                            </div>
                                            {date && (
                                                <span className="text-[9px] font-medium text-neutral-600">{date}</span>
                                            )}
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex-1 flex flex-col items-center gap-2 md:gap-3">
                                            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#111827] rounded-xl p-2 md:p-4 border border-[#1F2937] shadow-lg">
                                                <img src={awayLogo} alt={awayTeam} className="w-full h-full object-contain" />
                                            </div>
                                            <h2 className="text-xs md:text-base font-bold text-white tracking-tight text-center max-w-[100px] md:max-w-none line-clamp-2">
                                                {awayTeam}
                                            </h2>
                                        </div>

                                        {/* Confidence Gauge */}
                                        <div className="hidden lg:flex flex-col items-center">
                                            {data?.summary && (
                                                <ConfidenceGauge
                                                    value={data.summary.confidence}
                                                    size={130}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Confidence Gauge */}
                                    <div className="flex lg:hidden justify-center mt-5">
                                        {data?.summary && (
                                            <ConfidenceGauge
                                                value={data.summary.confidence}
                                                size={100}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ═══════ AI INSIGHT ═══════ */}
                            {data?.summary?.insightText && (
                                <div className="px-5 md:px-10 py-5 border-b border-[#1F2937] bg-[#111827]/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.15em] mb-1.5">
                                                AI Quantitative Insight
                                            </h4>
                                            <p className="text-[12px] md:text-sm font-medium text-[#D1D5DB] leading-relaxed">
                                                {data.summary.insightText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══════ MAIN CONTENT ═══════ */}
                            <div className="p-5 md:p-10 space-y-6">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="relative">
                                            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                                            <div className="absolute inset-0 w-10 h-10 rounded-full bg-amber-400/10 animate-pulse" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
                                            Running Engine Pipeline...
                                        </span>
                                    </div>
                                ) : isTrialExpired ? (
                                    <Paywall onUpgrade={() => router.push("/api/checkout")} />
                                ) : data ? (
                                    <>
                                        {/* ═══════ MARKET TABS ═══════ */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 mb-4">
                                                <BarChart3 className="w-4 h-4 text-amber-400" />
                                                <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Market Analysis</h3>
                                                <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                                <span className="text-[9px] font-bold text-neutral-600 tabular-nums">
                                                    {data.markets.length} markets
                                                </span>
                                            </div>

                                            <MarketTab
                                                title="High Probability"
                                                icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                                                count={highProb.length}
                                                defaultOpen={true}
                                            >
                                                {highProb.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
                                            </MarketTab>

                                            <MarketTab
                                                title="Medium Edge"
                                                icon={<Target className="w-4 h-4 text-amber-400" />}
                                                count={mediumAll.length}
                                                defaultOpen={mediumAll.length > 0 && highProb.length === 0}
                                            >
                                                {mediumAll.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
                                            </MarketTab>

                                            <MarketTab
                                                title="Value Plays"
                                                icon={<Zap className="w-4 h-4 text-emerald-400" />}
                                                count={valuePlays.length}
                                            >
                                                {valuePlays.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
                                            </MarketTab>

                                            <MarketTab
                                                title="Correct Score Predictions"
                                                icon={<Trophy className="w-4 h-4 text-purple-400" />}
                                                count={correctScores.length}
                                            >
                                                {correctScores.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)}
                                            </MarketTab>
                                        </div>

                                        {/* ═══════ MODEL SIGNALS ═══════ */}
                                        {data.signals.length > 0 && (
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center gap-3">
                                                    <Lock className="w-4 h-4 text-neutral-500" />
                                                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Model Signals</h3>
                                                    <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {data.signals.map((signal, idx) => (
                                                        <SignalCard key={idx} signal={signal} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ═══════ FOOTER ═══════ */}
                                        <div className="pt-6 space-y-4">
                                            <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] text-center">
                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.15em] leading-relaxed max-w-2xl mx-auto">
                                                    PitchPulse AI utilizes Bloomberg-grade quantitative modeling to analyze tactical setups and market mispricing. Projections are based on historical edge benchmarks.
                                                </p>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-2">
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                                    <span>Last Updated:</span>
                                                    <span className="text-neutral-400">
                                                        {data.meta.generatedAt
                                                            ? new Date(data.meta.generatedAt).toLocaleString('en-GB', {
                                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                                            })
                                                            : "—"}
                                                    </span>
                                                </div>
                                                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                                    Data: <span className="text-neutral-400">{data.meta.dataSource}</span>
                                                </div>
                                            </div>

                                            {/* Close Button */}
                                            <div className="flex justify-center pt-4 pb-2">
                                                <button
                                                    onClick={onClose}
                                                    className="px-10 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-[#1F2937] hover:border-[#374151]"
                                                >
                                                    Close Terminal
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
