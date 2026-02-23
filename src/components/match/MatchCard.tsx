"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, ShieldAlert, Star, Lock, Zap, Shield } from "lucide-react";
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
    // Engine v2 fields
    tier?: 'elite' | 'safe';
    odds?: number;
    evAdjusted?: number;
    edge?: number;
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
    tier = 'safe',
    odds,
    evAdjusted,
    edge,
}: MatchCardProps) {
    const [homeError, setHomeError] = useState(false);
    const [awayError, setAwayError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bet365Odds, setBet365Odds] = useState<number | null>(odds || null);
    const [bestBookmaker, setBestBookmaker] = useState<{ odds: number; name: string } | null>(null);

    const isEliteTier = tier === 'elite';

    // Tier-specific colors
    const tierAccent = isEliteTier ? '#FBBF24' : '#3B82F6'; // Gold vs Blue
    const tierGlow = isEliteTier ? 'shadow-amber-500/10' : 'shadow-blue-500/10';
    const tierBorder = isEliteTier ? 'border-amber-400/30 hover:border-amber-400/60' : 'border-blue-400/20 hover:border-blue-400/50';
    const tierBg = isEliteTier ? 'bg-amber-400/5' : 'bg-blue-400/5';

    // Fetch odds lazily on mount (READ ONLY — no prediction overrides)
    useEffect(() => {
        if (odds) return; // Already have odds from engine

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
                    if (data.best && data.best.bookmaker !== "bet365") {
                        setBestBookmaker({ odds: data.best.odds, name: data.best.bookmaker });
                    }
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
                    "bg-[#111827] rounded-xl overflow-hidden border transition-colors duration-200 flex flex-col h-full cursor-pointer group/card shadow-lg",
                    tierBorder,
                    tierGlow
                )}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="p-6 flex-1 flex flex-col">
                    {/* Header: Status, Time & Tier Badge */}
                    <div className="flex items-center justify-between mb-4">
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

                            {/* Tier Badge */}
                            {isEliteTier ? (
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-400/15 border border-amber-400/30 text-amber-400 text-[9px] font-bold uppercase tracking-widest">
                                    <Zap className="w-2.5 h-2.5" />
                                    Elite
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[9px] font-bold uppercase tracking-widest">
                                    <Shield className="w-2.5 h-2.5" />
                                    Safe
                                </div>
                            )}

                            {isLocked && (
                                <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[9px]">
                                    <Lock className="w-2 h-2" />
                                </div>
                            )}
                        </div>


                    </div>

                    {/* Teams Section - Redesigned 3-Column Grid */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 mb-6 pb-6 border-b border-[#1F2937]/50">
                        {/* Home Team Column */}
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937] overflow-hidden">
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
                                <h3 className="text-sm sm:text-base lg:text-base font-bold text-white tracking-tight leading-tight [text-wrap:balance]">
                                    {homeTeam}
                                </h3>
                            </div>
                        </div>

                        {/* Middle Column (VS) */}
                        <div className="flex items-center justify-center h-14 sm:h-16 lg:h-20 px-2">
                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">VS</span>
                        </div>

                        {/* Away Team Column */}
                        <div className="flex flex-col items-center text-center w-full">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937] overflow-hidden">
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
                                <h3 className="text-sm sm:text-base lg:text-base font-bold text-white tracking-tight leading-tight [text-wrap:balance]">
                                    {awayTeam}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Footer Section */}
                    <div className="mt-auto space-y-6">
                        {/* Signal & Odds */}
                        <div className="flex items-end justify-between pt-0">
                            <div className="flex flex-col gap-1">
                                {/* EV Badge (Engine v2) */}
                                {evAdjusted !== undefined && evAdjusted > 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold mb-1",
                                        isEliteTier
                                            ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                            : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                                    )}>
                                        +{(evAdjusted * 100).toFixed(1)}% EV
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                        Market
                                    </span>
                                    <span className="text-xs sm:text-sm lg:text-base font-bold text-white uppercase line-clamp-2 max-w-[200px] sm:max-w-[240px]">
                                        {prediction}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Odds
                                </span>
                                <div className={cn(
                                    "text-xl sm:text-2xl font-bold",
                                    isEliteTier ? "text-[#FBBF24]" : "text-blue-400"
                                )}>
                                    {bet365Odds ? `@${bet365Odds.toFixed(2)}` : "—"}
                                </div>
                            </div>
                        </div>

                        {/* Confidence Indicator */}
                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            tierBg,
                            isEliteTier ? "border-amber-400/10" : "border-blue-400/10"
                        )}>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                                    Confidence
                                </span>
                                <div className="text-xl sm:text-2xl font-bold text-white">
                                    {confidence}%
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                    confidence >= 75 ? "bg-emerald-500 text-white" : confidence >= 60 ? "bg-amber-500 text-white" : "bg-neutral-800 text-neutral-400"
                                )}>
                                    {confidence >= 75 ? "Strong" : confidence >= 60 ? "Moderate" : "Neutral"}
                                </span>
                            </div>
                        </div>

                        {/* Full Analysis Button */}
                        <div className={cn(
                            "w-full py-3 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2",
                            isEliteTier
                                ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20"
                                : "bg-[#1F2937] hover:bg-[#374151]"
                        )}>
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
                prediction={prediction}
                date={date}
                time={time}
            />
        </>
    );
}
