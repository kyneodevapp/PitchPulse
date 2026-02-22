"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, Info, ShieldAlert, Star, AlertCircle, Lock } from "lucide-react";
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
    isLocked,
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

                    // If isLocked is true, we ONLY care about the odds.
                    // We strictly DO NOT want to override the prediction outcome or confidence.
                    if (isLocked) {
                        if (data.bet365) setBet365Odds(data.bet365);
                        if (data.best && data.best.bookmaker !== "bet365") {
                            setBestBookmaker({ odds: data.best.odds, name: data.best.bookmaker });
                        }
                        return;
                    }

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

                        // IMPORTANT: Save this upgraded prediction to persistence so History uses IT
                        // Only save if it wasn't already locked with this outcome
                        if (!isLocked) {
                            import("@/lib/services/prediction").then(({ PredictionStore }) => {
                                PredictionStore.save(id, {
                                    mainPrediction: {
                                        outcome: data.suggestedBet.outcome,
                                        confidence: data.suggestedBet.confidence,
                                        isPrime: !!data.suggestedBet.isPrime,
                                        isElite: !!data.suggestedBet.isElite,
                                        starRating: data.suggestedBet.starRating,
                                        kellyStake: data.suggestedBet.kellyStake,
                                        candidates: data.suggestedBet.candidates
                                    },
                                    summary: "Value-optimized automated prediction",
                                    markets: data.markets,
                                    signals: data.signals
                                });
                            });
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
    }, [id, prediction, homeTeam, awayTeam, isLocked]);


    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#111827] rounded-xl overflow-hidden border border-[#1F2937] hover:border-amber-400/50 transition-colors duration-200 flex flex-col h-full cursor-pointer group/card shadow-lg"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                    {/* Header: Status & Time */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest",
                                isLive ? "bg-red-500 text-white" : "bg-neutral-800 text-neutral-300"
                            )}>
                                {isLive ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Live
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-3 h-3 sm:w-4 h-4" />
                                        {date} • {time}
                                    </>
                                )}
                            </div>

                            {isLocked && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                    <Lock className="w-2.5 h-2.5" />
                                    Locked
                                </div>
                            )}
                        </div>

                        <div className="text-neutral-500 group-hover/card:text-neutral-300 transition-colors">
                            <Info className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Teams Section */}
                    <div className="flex items-center justify-between gap-4 mb-8">
                        {/* Home Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937]">
                                {!homeError && homeLogo ? (
                                    <img
                                        src={homeLogo}
                                        alt={homeTeam}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-1"
                                        onError={() => setHomeError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-6 h-6 text-neutral-600" />
                                )}
                            </div>
                            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white tracking-tight line-clamp-2 leading-tight">
                                {homeTeam}
                            </h3>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-neutral-600">VS</span>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937]">
                                {!awayError && awayLogo ? (
                                    <img
                                        src={awayLogo}
                                        alt={awayTeam}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-1"
                                        onError={() => setAwayError(true)}
                                    />
                                ) : (
                                    <ShieldAlert className="w-6 h-6 text-neutral-600" />
                                )}
                            </div>
                            <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white tracking-tight line-clamp-2 leading-tight">
                                {awayTeam}
                            </h3>
                        </div>
                    </div>

                    {/* Metrics Footer Section */}
                    <div className="mt-auto space-y-6">
                        {/* Signal & Odds */}
                        <div className="flex items-end justify-between border-t border-[#1F2937] pt-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "w-3 h-3",
                                                i < (starRating / 2)
                                                    ? "text-[#FBBF24] fill-[#FBBF24]"
                                                    : "text-neutral-800"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                        Market
                                    </span>
                                    <span className="text-sm sm:text-base font-bold text-white uppercase truncate max-w-[120px]">
                                        {dynamicPrediction}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Odds
                                </span>
                                <div className="text-xl sm:text-2xl font-bold text-[#FBBF24]">
                                    {bet365Odds ? `@${bet365Odds.toFixed(2)}` : "—"}
                                </div>
                            </div>
                        </div>

                        {/* Confidence Indicator */}
                        <div className="flex items-center justify-between p-3 bg-[#0B0F14] rounded-lg border border-[#1F2937]">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                                    Confidence
                                </span>
                                <div className="text-xl sm:text-2xl font-bold text-white">
                                    {dynamicConfidence}%
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                    dynamicConfidence >= 75 ? "bg-emerald-500 text-white" : dynamicConfidence >= 60 ? "bg-amber-500 text-white" : "bg-neutral-800 text-neutral-400"
                                )}>
                                    {dynamicConfidence >= 75 ? "Strong" : dynamicConfidence >= 60 ? "Moderate" : "Neutral"}
                                </span>
                            </div>
                        </div>

                        {/* Full Analysis Button */}
                        <div className="w-full py-3 bg-[#1F2937] hover:bg-[#374151] rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2">
                            Full Analysis
                            <TrendingUp className="w-4 h-4" />
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
                prediction={dynamicPrediction}
                date={date}
                time={time}
            />
        </>
    );
}
