"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Loader2, Check, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { sportmonksService, MarketAnalysis, MatchSummary, ModelSignal, BestOdds } from "@/lib/services/prediction";
import { MarketGrid } from "./MarketGrid";
import { Paywall } from "./Paywall";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "../ui/Toast";
import { useRouter } from "next/navigation";

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

export function MatchAnalysisModal({
    isOpen,
    onClose,
    fixtureId,
    homeTeam,
    awayTeam,
    homeLogo,
    awayLogo,
    leagueName,
    prediction,
    date,
    time
}: MatchAnalysisModalProps) {
    const [markets, setMarkets] = useState<MarketAnalysis[]>([]);
    const [matchSummary, setMatchSummary] = useState<MatchSummary | null>(null);
    const [modelSignals, setModelSignals] = useState<ModelSignal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [showFooter, setShowFooter] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [oddsComparison, setOddsComparison] = useState<BestOdds[]>([]);
    const [isPrime, setIsPrime] = useState(false);
    const [isElite, setIsElite] = useState(false);
    const [expectedValue, setExpectedValue] = useState<number>(0);

    const router = useRouter();
    const { isLoaded, isSubscribed, trialActive, daysLeft, isTrialExpired } = useSubscription();

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollY = useMotionValue(0);
    const footerOpacity = useMotionValue(0);

    // Smooth scroll-linked transforms for header/banner
    const mobileHeaderOpacity = useTransform(scrollY, [0, 100], [1, 0]);
    const mobileHeaderScale = useTransform(scrollY, [0, 100], [1, 0.98]);

    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const { toasts, showToast } = useToast();

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                const oddsParams = new URLSearchParams({
                    fixtureId: String(fixtureId),
                    ...(prediction ? { prediction, homeTeam, awayTeam } : {}),
                });
                const [marketData, summaryData, signalsData, oddsResp] = await Promise.all([
                    sportmonksService.getMarketAnalyses(fixtureId, homeTeam, awayTeam),
                    sportmonksService.getMatchSummary(fixtureId),
                    sportmonksService.getModelSignals(fixtureId),
                    fetch(`/api/odds?${oddsParams}`).then(r => r.ok ? r.json() : { all: [] }),
                ]);
                setMarkets(marketData);
                setMatchSummary(summaryData);
                setModelSignals(signalsData);
                setOddsComparison(oddsResp.all || []);
                const suggested = oddsResp.suggestedBet;
                setIsPrime(!!suggested?.isPrime);
                setIsElite(!!suggested?.isElite);
                setExpectedValue(suggested?.expectedValue || 0);
                setIsLoading(false);
            };
            fetchData();
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [isOpen, fixtureId, prediction]);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setShowHeader(true);
            setShowFooter(false);
            setShowBanner(true);
            scrollY.set(0);
            footerOpacity.set(0);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, scrollY, footerOpacity]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // Update motion value for smooth transforms
        scrollY.set(scrollTop);

        // Footer opacity logic for mobile (fade in near bottom)
        if (isMobile) {
            const bottomDistance = scrollHeight - clientHeight - scrollTop;
            const newOpacity = Math.max(0, Math.min(1, 1 - (bottomDistance / 100)));
            footerOpacity.set(newOpacity);
        }

        // Header visibility logic (Mobile Only - Desktop scrolls naturally to avoid jumps)
        if (isMobile) {
            // Mobile specific logic if needed, currently handled by mobileHeaderOpacity transforms
        }

        // AI Banner logic (Mobile Only - Desktop should scroll naturally)
        if (isMobile) {
            if (scrollTop > 80 && showBanner) {
                setShowBanner(false);
            } else if (scrollTop <= 80 && !showBanner) {
                setShowBanner(true);
            }
        }

        // Footer visibility logic (reveal at bottom) - Desktop only
        if (!isMobile) {
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 40;
            if (isAtBottom && !showFooter) {
                setShowFooter(true);
            } else if (!isAtBottom && showFooter) {
                setShowFooter(false);
            }
        }
    };

    const isWatchlisted = isInWatchlist(fixtureId);

    if (!mounted) return null;

    const renderFooterContent = () => (
        <div className="flex flex-col items-center justify-center w-full gap-6">
            <button
                onClick={onClose}
                className="w-full md:w-auto min-w-[200px] px-10 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-[11px] font-black text-white uppercase tracking-[0.2em] transition-all border border-white/10 flex items-center justify-center shadow-xl shadow-black/20"
            >
                Close Terminal
            </button>

            {matchSummary?.generatedAt && (
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">
                    Analysis Generated: <span className="text-white/40">{new Date(matchSummary.generatedAt).toLocaleString()}</span>
                </div>
            )}
        </div>
    );

    const modalContent = (
        <div key="modal-root">
            <AnimatePresence mode="wait">
                {isOpen && (
                    <div key="modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8 overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full max-w-6xl h-[calc(100dvh-0.5rem)] md:h-auto md:max-h-[90vh] bg-[#0B0F14] border border-[#1F2937] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col overscroll-none"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 rounded-lg bg-[#111827] hover:bg-[#1F2937] text-white transition-all border border-[#1F2937] z-[60]"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            {/* Body & Scroll Content */}
                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto min-h-0 overscroll-contain custom-scrollbar relative"
                            >
                                {/* Header Section */}
                                <div className="border-b border-[#1F2937]">
                                    <motion.div
                                        style={isMobile ? { opacity: mobileHeaderOpacity } : {}}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-16 md:p-12">
                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
                                                {/* Team logos & Info */}
                                                <div className="flex-1 flex items-center justify-center gap-8 md:gap-16">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-[#111827] rounded-xl p-2 sm:p-4 md:p-6 border border-[#1F2937] shadow-xl relative">
                                                            <img src={homeLogo} alt={homeTeam} className="w-full h-full object-contain relative" />
                                                        </div>
                                                        <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-white tracking-tight text-center max-w-[100px] sm:max-w-[140px] md:max-w-none line-clamp-2">
                                                            {homeTeam}
                                                        </h2>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-[10px] md:text-xs font-bold text-neutral-400 tracking-widest uppercase">
                                                            VS
                                                        </div>
                                                        <div className="h-10 md:h-16 w-[2px] bg-[#1F2937]" />
                                                    </div>

                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-[#111827] rounded-xl p-2 sm:p-4 md:p-6 border border-[#1F2937] shadow-xl relative">
                                                            <img src={awayLogo} alt={awayTeam} className="w-full h-full object-contain relative" />
                                                        </div>
                                                        <h2 className="text-sm sm:text-lg md:text-2xl font-bold text-white tracking-tight text-center max-w-[100px] sm:max-w-[140px] md:max-w-none line-clamp-2">
                                                            {awayTeam}
                                                        </h2>
                                                    </div>
                                                </div>

                                                {/* Confidence Indicator */}
                                                <div className="flex flex-col items-center lg:items-end">
                                                    <div className="relative w-24 h-24 md:w-44 md:h-44 flex items-center justify-center bg-[#111827] rounded-xl border border-[#1F2937] p-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs font-bold text-[#FBBF24] uppercase tracking-widest mb-1">
                                                                Confidence
                                                            </span>
                                                            <span className="text-3xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">
                                                                {matchSummary?.overallConfidence}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Match Meta Info */}
                                            <div className="mt-8 flex items-center justify-center text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                                <div className="flex items-center gap-2 bg-[#111827] px-4 py-2 rounded-lg border border-[#1F2937]">
                                                    <span className="text-[#FBBF24]">KICKOFF:</span>
                                                    <span className="text-white">{date} • {time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Summary Insight Badge */}
                                <motion.div
                                    initial={false}
                                    style={isMobile ? { opacity: mobileHeaderOpacity } : {}}
                                    className={cn(
                                        "flex-shrink-0 px-6 md:px-12 py-4 md:py-6 border-y flex flex-col md:flex-row items-center gap-6 sticky top-0 md:relative z-40 bg-[#111827]",
                                        isPrime ? "border-amber-400/30" : "border-[#1F2937]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black",
                                            isPrime ? "bg-[#FBBF24]" : "bg-white"
                                        )}>
                                            AI
                                        </div>
                                        <h4 className={cn(
                                            "text-xs font-bold uppercase tracking-widest",
                                            isPrime ? "text-[#FBBF24]" : "text-white"
                                        )}>
                                            {isPrime ? "Oracle Insight" : "Match Insight"}
                                        </h4>
                                    </div>
                                    <p className="text-sm md:text-base font-medium text-[#D1D5DB] leading-relaxed italic">
                                        "{matchSummary?.summaryText}"
                                    </p>
                                </motion.div>

                                {/* Main Content Wrapper */}
                                <div className="p-6 md:p-12 space-y-16">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                                            <Loader2 className="w-10 h-10 text-[#FBBF24] animate-spin" />
                                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9CA3AF]">
                                                Crunching Model Data...
                                            </span>
                                        </div>
                                    ) : isTrialExpired ? (
                                        <Paywall onUpgrade={() => router.push("/api/checkout")} />
                                    ) : (
                                        <>
                                            <MarketGrid markets={markets} />

                                            {/* Model Signals Table/Grid */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em]">Model Signals</h3>
                                                    <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {modelSignals.map((signal, idx) => (
                                                        <div key={idx} className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 hover:bg-[#1C2533] transition-colors group">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{signal.name}</span>
                                                                <span className={cn(
                                                                    "text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase",
                                                                    signal.rating === "High" || signal.rating === "Elite" ? "text-emerald-400 bg-emerald-400/10" :
                                                                        signal.rating === "Medium" ? "text-[#FBBF24] bg-amber-400/10" : "text-rose-400 bg-red-400/10"
                                                                )}>
                                                                    {signal.rating}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-end gap-3 mb-4">
                                                                <span className="text-3xl font-bold text-white tabular-nums">{signal.value}</span>
                                                                <span className="text-[10px] font-bold text-neutral-600 mb-1">SCORE</span>
                                                            </div>
                                                            <p className="text-xs font-medium text-neutral-400 leading-relaxed">
                                                                {signal.explanation}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Odds Comparison */}
                                            {oddsComparison.length > 0 && (
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className="text-xs font-bold text-white uppercase tracking-[0.3em]">Bookmaker Comparison</h3>
                                                        <div className="h-[1px] flex-1 bg-[#1F2937]" />
                                                    </div>
                                                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
                                                        <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-3 bg-[#0B0F14] border-b border-[#1F2937]">
                                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Bookmaker</span>
                                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest text-right">Decimal Odds</span>
                                                        </div>
                                                        {oddsComparison.map((odd, idx) => {
                                                            const isBest = idx === 0;
                                                            return (
                                                                <div key={idx} className={cn(
                                                                    "grid grid-cols-[1fr_auto] gap-4 px-6 py-4 items-center transition-colors hover:bg-[#1C2533]",
                                                                    idx < oddsComparison.length - 1 ? "border-b border-[#1F2937]" : ""
                                                                )}>
                                                                    <div className="flex items-center gap-2">
                                                                        {isBest && <span className="text-[9px] font-bold text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-sm">BEST VALUE</span>}
                                                                        <span className={cn("text-xs font-bold", isBest ? "text-white" : "text-[#D1D5DB]")}>{odd.bookmaker}</span>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-sm font-bold text-right tabular-nums",
                                                                        isBest ? "text-emerald-400" : "text-white"
                                                                    )}>{odd.odds.toFixed(2)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Disclaimer */}
                                            <div className="p-8 rounded-xl bg-[#111827] border border-[#1F2937] text-center mb-12">
                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] leading-relaxed max-w-2xl mx-auto">
                                                    PitchPulse AI utilizes Bloomberg-grade quantitative modeling to analyze tactical setups and market mispricing. Projections are based on historical edge benchmarks.
                                                </p>
                                            </div>

                                            {/* Mobile Footer */}
                                            {isMobile && (
                                                <motion.div
                                                    style={{ opacity: footerOpacity }}
                                                    className="mt-12 pt-12 border-t border-[#1F2937]"
                                                >
                                                    {renderFooterContent()}
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Desktop Footer (Outside, Docked) */}
                            {!isMobile && (
                                <AnimatePresence>
                                    {showFooter && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0, y: 40 }}
                                            animate={{ height: "auto", opacity: 1, y: 0 }}
                                            exit={{ height: 0, opacity: 0, y: 40 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="p-8 border-t border-[#1F2937] bg-[#111827] z-[50] overflow-hidden"
                                        >
                                            {renderFooterContent()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </motion.div>
                    </div>
                )
                }
                {isOpen && <ToastContainer toasts={toasts} />}
            </AnimatePresence >
        </div >
    );

    return createPortal(modalContent, document.body);
}
