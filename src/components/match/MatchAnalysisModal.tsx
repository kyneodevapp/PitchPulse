"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { sportmonksService, MarketAnalysis, MatchSummary, ModelSignal } from "@/lib/services/prediction";
import { MarketGrid } from "./MarketGrid";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "../ui/Toast";

interface MatchAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo?: string;
    awayLogo?: string;
    leagueName?: string;
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

        if (isOpen && markets.length === 0) {
            const fetchData = async () => {
                setIsLoading(true);
                const [marketData, summaryData, signalsData] = await Promise.all([
                    sportmonksService.getMarketAnalyses(fixtureId),
                    sportmonksService.getMatchSummary(fixtureId),
                    sportmonksService.getModelSignals(fixtureId)
                ]);
                setMarkets(marketData);
                setMatchSummary(summaryData);
                setModelSignals(signalsData);
                setIsLoading(false);
            };
            fetchData();
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [isOpen, fixtureId, markets.length]);

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

        // Header visibility logic (Desktop only)
        if (!isMobile) {
            if (scrollTop > 100 && showHeader) {
                setShowHeader(false);
            } else if (scrollTop <= 100 && !showHeader) {
                setShowHeader(true);
            }
        }

        // AI Banner logic
        if (scrollTop > 80 && showBanner) {
            setShowBanner(false);
        } else if (scrollTop <= 80 && !showBanner) {
            setShowBanner(true);
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
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative w-full max-w-6xl h-[calc(100vh-1rem)] md:h-auto md:max-h-[95vh] glass-dark border border-white/10 md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col overscroll-none"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 z-[60]"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            {/* Body & Scroll Content */}
                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto min-h-0 overscroll-contain custom-scrollbar relative"
                            >
                                {/* Header Section (Inside scroll for natural flow) */}
                                <AnimatePresence mode="popLayout">
                                    {(showHeader || isMobile) && (
                                        <motion.div
                                            style={isMobile ? {
                                                opacity: mobileHeaderOpacity,
                                                scale: mobileHeaderScale
                                            } : {}}
                                            initial={isMobile ? false : { height: "auto", opacity: 1, y: 0 }}
                                            animate={isMobile ? { height: "auto" } : { height: "auto", opacity: 1, y: 0 }}
                                            exit={{ height: 0, opacity: 0, y: -40 }}
                                            transition={{ duration: 0.35, ease: "easeInOut" }}
                                            className="border-b border-white/5 overflow-hidden"
                                        >
                                            <div className="p-4 pt-12 md:p-12">
                                                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-12">
                                                    {/* Team logos & Info */}
                                                    <div className="flex-1 flex items-center justify-center gap-6 md:gap-16">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 md:w-32 md:h-32 bg-white/5 rounded-2xl md:rounded-3xl p-2 md:p-4 border border-white/10 shadow-2xl relative group focus-within:ring-2 focus-within:ring-purple-500/50">
                                                                <div className="absolute inset-0 bg-purple-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <img src={homeLogo} alt={homeTeam} className="w-full h-full object-contain relative" />
                                                            </div>
                                                            <h2 className="text-sm md:text-2xl font-black text-white uppercase tracking-tight text-center max-w-[120px] md:max-w-none truncate">{homeTeam}</h2>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">
                                                                VS
                                                            </div>
                                                            <div className="h-8 md:h-12 w-[1px] bg-gradient-to-b from-white/5 via-white/20 to-white/5" />
                                                        </div>

                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 md:w-32 md:h-32 bg-white/5 rounded-2xl md:rounded-3xl p-2 md:p-4 border border-white/10 shadow-2xl relative group focus-within:ring-2 focus-within:ring-purple-500/50">
                                                                <div className="absolute inset-0 bg-purple-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <img src={awayLogo} alt={awayTeam} className="w-full h-full object-contain relative" />
                                                            </div>
                                                            <h2 className="text-sm md:text-2xl font-black text-white uppercase tracking-tight text-center max-w-[120px] md:max-w-none truncate">{awayTeam}</h2>
                                                        </div>
                                                    </div>

                                                    {/* AI Confidence Meter */}
                                                    <div className="flex flex-col items-center lg:items-end">
                                                        <div className="relative w-20 h-20 md:w-40 md:h-40 flex items-center justify-center">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    r="45%"
                                                                    className="stroke-white/5 fill-none"
                                                                    strokeWidth="8"
                                                                />
                                                                <motion.circle
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    r="45%"
                                                                    className="stroke-purple-500 fill-none"
                                                                    strokeWidth="8"
                                                                    strokeLinecap="round"
                                                                    initial={{ pathLength: 0 }}
                                                                    animate={{ pathLength: (matchSummary?.overallConfidence || 0) / 100 }}
                                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                                />
                                                            </svg>
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">
                                                                    {matchSummary?.overallConfidence}%
                                                                </span>
                                                                <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Confidence</span>
                                                            </div>
                                                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl -z-10 rounded-full" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Match Meta Info */}
                                                <div className="mt-4 md:mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-6 text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-white/40">
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/5">
                                                        <span className="text-purple-400">VENUE:</span> {matchSummary?.venue}
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/5">
                                                        <span className="text-purple-400">WEATHER:</span> {matchSummary?.weather}
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/5">
                                                        <span className="text-purple-400">KICKOFF:</span> {date} • {time}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* AI Summary Banner (Inside scroll) */}
                                <AnimatePresence>
                                    {(showBanner || isMobile) && (
                                        <motion.div
                                            style={isMobile ? { opacity: mobileHeaderOpacity } : {}}
                                            initial={isMobile ? false : { height: 0, opacity: 0, scaleY: 0 }}
                                            animate={isMobile ? { height: "auto" } : { height: "auto", opacity: 1, scaleY: 1 }}
                                            exit={{ height: 0, opacity: 0, scaleY: 0, y: -20 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            className="flex-shrink-0 px-6 md:px-12 py-3.5 md:py-5 bg-purple-500/10 border-y border-purple-500/20 flex flex-col md:flex-row items-center gap-4 md:gap-6 overflow-hidden origin-top"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                                    <span className="text-white font-black text-lg">AI</span>
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Match Insight</h4>
                                            </div>
                                            <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                                                "{matchSummary?.summaryText}"
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Main Content Wrapper */}
                                <div className="p-6 md:p-12">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/20 text-center px-4">Crunching thousands of data points...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-16">
                                            <MarketGrid markets={markets} />

                                            {/* Model Signals Section */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Model Signals</h3>
                                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {modelSignals.map((signal, idx) => (
                                                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{signal.name}</span>
                                                                <span className={cn(
                                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                                                                    signal.rating === "High" || signal.rating === "Elite" ? "text-emerald-400 bg-emerald-400/10" :
                                                                        signal.rating === "Medium" ? "text-amber-400 bg-amber-400/10" : "text-rose-400 bg-rose-400/10"
                                                                )}>
                                                                    {signal.rating}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-end gap-3 mb-4">
                                                                <span className="text-3xl font-black text-white">{signal.value}</span>
                                                                <span className="text-xs font-bold text-white/20 mb-1">SCORE</span>
                                                            </div>
                                                            <p className="text-[10px] font-medium text-white/40 leading-relaxed">
                                                                {signal.explanation}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Disclaimer */}
                                            <div className="p-8 rounded-3xl bg-purple-500/5 border border-purple-500/10 text-center mb-12">
                                                <p className="text-[10px] font-bold text-purple-400/60 uppercase tracking-[0.2em] leading-relaxed max-w-2xl mx-auto">
                                                    PitchPulse AI analyzes historical form, player availability, tactical setups, and market sentiment to deliver high-precision probability outcomes.
                                                </p>
                                            </div>

                                            {/* Mobile Footer (Inside flow) */}
                                            {isMobile && (
                                                <motion.div
                                                    style={{ opacity: footerOpacity }}
                                                    className="mt-12 pt-12 border-t border-white/5"
                                                >
                                                    {renderFooterContent()}
                                                </motion.div>
                                            )}
                                        </div>
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
                                            transition={{ duration: 0.35, ease: "easeInOut" }}
                                            className="p-8 border-t border-white/5 bg-white/[0.04] backdrop-blur-xl z-[50] overflow-hidden"
                                        >
                                            {renderFooterContent()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </motion.div>
                    </div>
                )}
                {isOpen && <ToastContainer toasts={toasts} />}
            </AnimatePresence>
        </div>
    );

    return createPortal(modalContent, document.body);
}
