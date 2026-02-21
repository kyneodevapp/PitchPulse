"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, Info, ShieldAlert, Star, AlertCircle } from "lucide-react";
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
}

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
}: MatchCardProps) {
    const [homeError, setHomeError] = useState(false);
    const [awayError, setAwayError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bet365Odds, setBet365Odds] = useState<number | null>(null);
    const [bestBookmaker, setBestBookmaker] = useState<{ odds: number; name: string } | null>(null);
    const [dynamicPrediction, setDynamicPrediction] = useState(prediction);
    const [dynamicConfidence, setDynamicConfidence] = useState(confidence);
    const [isPrime, setIsPrime] = useState(false);
    const [isElite, setIsElite] = useState(false);
    const [expectedValue, setExpectedValue] = useState<number>(0);
    const [starRating, setStarRating] = useState<number>(0);
    const [kellyStake, setKellyStake] = useState<number>(0);

    // Fetch odds lazily on mount
    useEffect(() => {
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

                    // If we have a value-optimized suggestBet, use IT for everything
                    if (data.suggestedBet) {
                        setDynamicPrediction(data.suggestedBet.outcome);
                        setDynamicConfidence(data.suggestedBet.confidence);
                        setIsPrime(!!data.suggestedBet.isPrime);
                        setIsElite(!!data.suggestedBet.isElite);
                        setExpectedValue(data.suggestedBet.expectedValue || 0);
                        setBet365Odds(data.suggestedBet.bet365 || data.suggestedBet.odds || null);
                        setStarRating(data.suggestedBet.starRating || 0);
                        setKellyStake(data.suggestedBet.kellyStake || 0);

                        // Handle best bookmaker for the NEW prediction
                        if (data.suggestedBet.best && data.suggestedBet.best.bookmaker !== "bet365") {
                            setBestBookmaker({
                                odds: data.suggestedBet.best.odds,
                                name: data.suggestedBet.best.bookmaker
                            });
                        } else {
                            setBestBookmaker(null);
                        }
                    } else {
                        // Fallback to original prediction odds
                        if (data.bet365) setBet365Odds(data.bet365);
                        if (data.best && data.best.bookmaker !== "bet365") {
                            setBestBookmaker({ odds: data.best.odds, name: data.best.bookmaker });
                        }
                    }
                }
            } catch {
                // Odds not available
            }
        };
        fetchOdds();
    }, [id, prediction, homeTeam, awayTeam]);

    return (
        <>
            <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass-dark rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-300 flex flex-col h-full cursor-pointer group/card"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-8">
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            isLive ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-white/5 text-white/40 border border-white/10"
                        )}>
                            {isLive ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Live Now
                                </>
                            ) : (
                                <>
                                    <Clock className="w-3 h-3" />
                                    {date} • {time}
                                </>
                            )}
                        </div>
                        <button className="text-white/20 hover:text-white/40 transition-colors">
                            <Info className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-3 relative flex items-center justify-center bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                {!homeError && homeLogo ? (
                                    <img
                                        src={homeLogo}
                                        alt={homeTeam}
                                        className="w-full h-full object-contain p-2 filter drop-shadow-xl"
                                        onError={() => setHomeError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-6 h-6 text-white/10" />
                                )}
                            </div>
                            <span className="text-sm font-bold text-white line-clamp-1">{homeTeam}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-white/10 italic">VS</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-3 relative flex items-center justify-center bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                {!awayError && awayLogo ? (
                                    <img
                                        src={awayLogo}
                                        alt={awayTeam}
                                        className="w-full h-full object-contain p-2 filter drop-shadow-xl"
                                        onError={() => setAwayError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-6 h-6 text-white/10" />
                                )}
                            </div>
                            <span className="text-sm font-bold text-white line-clamp-1">{awayTeam}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                    {[...Array(10)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-1.5 h-1.5",
                                                i < starRating
                                                    ? (isElite ? "text-cyan-400 fill-cyan-400" : (isPrime ? "text-amber-400 fill-amber-400" : "text-purple-400 fill-purple-400"))
                                                    : "text-white/10 fill-transparent"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className={cn(
                                    "font-black tracking-[0.2em] text-[10px] whitespace-nowrap flex items-center gap-1.5",
                                    (starRating < 4 && dynamicConfidence < 60) ? "text-red-400" : (isElite ? "text-cyan-400" : (isPrime ? "text-amber-400" : "text-white/40"))
                                )}>
                                    {isElite && (
                                        <span className="px-1 py-0.5 rounded-sm bg-cyan-400/10 border border-cyan-400/20 text-[8px] tracking-[0.1em] opacity-80 animate-pulse">ELITE QUANT</span>
                                    )}
                                    {isPrime && !isElite && starRating >= 4 && (
                                        <span className="px-1 py-0.5 rounded-sm bg-amber-400/10 border border-amber-400/20 text-[8px] tracking-[0.1em] opacity-80">ORACLE</span>
                                    )}
                                    {(starRating < 4 && dynamicConfidence < 60) ? "LOW VALUE / AVOID" : (isElite ? "ELITE VALUE BET" : (isPrime ? "PRIME VALUE BET" : "SAFE PICK"))}
                                </span>
                                {isElite && (
                                    <div className="h-[2px] w-12 bg-gradient-to-r from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                                )}
                                {isPrime && !isElite && starRating >= 4 && (
                                    <div className="h-[2px] w-12 bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-right">
                                <span className={cn(
                                    "font-bold uppercase tracking-widest text-[10px] line-clamp-1",
                                    (starRating < 4 && dynamicConfidence < 60) ? "text-white/30" : (isPrime ? "text-white" : "text-purple-400")
                                )}>
                                    {dynamicPrediction}
                                </span>
                                {bet365Odds && (
                                    <span className={cn(
                                        "font-black text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap animate-in fade-in zoom-in h-[22px] flex items-center justify-center",
                                        isElite
                                            ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                            : (isPrime
                                                ? "bg-amber-400/20 text-amber-400 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                                : "bg-emerald-400/10 text-emerald-400")
                                    )}>
                                        @ {bet365Odds.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dynamicConfidence}%` }}
                            className={cn(
                                "absolute inset-y-0 left-0 rounded-full",
                                isElite
                                    ? "bg-gradient-to-r from-cyan-600 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                                    : (isPrime
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                                        : "bg-gradient-to-r from-purple-600 to-indigo-600")
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] uppercase">
                        <span className={isElite ? "text-cyan-400/60" : (isPrime ? "text-amber-400/60" : "text-white/40")}>AI CONFIDENCE</span>
                        <span className={isElite ? "text-cyan-400" : (isPrime ? "text-amber-400" : "text-white/60")}>{dynamicConfidence}%</span>
                    </div>

                    {isElite && expectedValue > 0 && (
                        <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] uppercase mt-2">
                            <span className="text-emerald-400/60">EXPECTED VALUE</span>
                            <span className="text-emerald-400">+{(expectedValue * 100).toFixed(1)}%</span>
                        </div>
                    )}

                    {bestBookmaker && bestBookmaker.odds > (bet365Odds || 0) && (
                        <div className="text-[9px] font-bold text-amber-400/70 text-right tracking-wider">
                            Best: {bestBookmaker.odds.toFixed(2)} @ {bestBookmaker.name}
                        </div>
                    )}

                    {(starRating < 4 && dynamicConfidence < 60) && starRating > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl mt-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                Trap Game: Avoid Standalone Bet
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className="w-full py-4 bg-white/[0.02] group-hover/card:bg-purple-500/10 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover/card:text-white transition-all flex items-center justify-center gap-2"
                >
                    Full Analysis
                    <TrendingUp className="w-3 h-3 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 transition-transform" />
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
                prediction={dynamicPrediction}
                date={date}
                time={time}
            />
        </>
    );
}
