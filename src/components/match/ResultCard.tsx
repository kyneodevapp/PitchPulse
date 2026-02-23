"use client";

import { motion } from "framer-motion";
import { Check, X as XIcon, Clock, ShieldAlert, Lock, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PastMatch } from "@/lib/services/prediction";

interface ResultCardProps {
    match: PastMatch;
    leagueName: string;
}

export function ResultCard({ match, leagueName }: ResultCardProps) {
    const [homeError, setHomeError] = useState(false);
    const [awayError, setAwayError] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111827] rounded-xl overflow-hidden border border-[#1F2937] hover:border-amber-400/50 transition-colors duration-200 flex flex-col h-full cursor-pointer group/card shadow-lg"
        >
            <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                {/* Header: Status & Result */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            <Clock className="w-3 h-3 sm:w-4 h-4" />
                            {match.date}
                        </div>

                        {match.is_locked && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                        match.prediction_hit
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                    )}>
                        {match.prediction_hit ? (
                            <>
                                <Check className="w-3 h-3" />
                                Hit
                            </>
                        ) : (
                            <>
                                <XIcon className="w-3 h-3" />
                                Miss
                            </>
                        )}
                    </div>
                </div>

                {/* Teams Section */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937]">
                            {!homeError && match.home_logo ? (
                                <img
                                    src={match.home_logo}
                                    alt={match.home_team}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-1"
                                    onError={() => setHomeError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-6 h-6 text-neutral-600" />
                            )}
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-white tracking-tight line-clamp-2 leading-tight">
                            {match.home_team}
                        </h3>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1 px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{match.home_score}</span>
                            <span className="text-lg font-bold text-neutral-700">-</span>
                            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{match.away_score}</span>
                        </div>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest bg-[#0B0F14] px-2 py-0.5 rounded border border-[#1F2937]">FT</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 relative flex items-center justify-center bg-[#0B0F14] rounded-xl border border-[#1F2937]">
                            {!awayError && match.away_logo ? (
                                <img
                                    src={match.away_logo}
                                    alt={match.away_team}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-1"
                                    onError={() => setAwayError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-6 h-6 text-neutral-600" />
                            )}
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-white tracking-tight line-clamp-2 leading-tight">
                            {match.away_team}
                        </h3>
                    </div>
                </div>

                {/* Metrics Footer Section */}
                <div className="mt-auto space-y-6">
                    {/* Signal & Results */}
                    <div className="flex items-end justify-between border-t border-[#1F2937] pt-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "w-3 h-3",
                                            "text-neutral-800 shadow-sm"
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Final Pick
                                </span>
                                <span className={cn(
                                    "text-sm sm:text-base font-bold uppercase truncate max-w-[120px]",
                                    match.prediction_hit ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {match.prediction}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                Status
                            </span>
                            <div className={cn(
                                "text-xl sm:text-2xl font-bold",
                                match.prediction_hit ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {match.prediction_hit ? "HIT" : "MISS"}
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
                                {match.confidence}%
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                            <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold uppercase",
                                match.prediction_hit ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" : "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                            )}>
                                {match.prediction_hit ? "Verification: OK" : "Verification: NO"}
                            </span>
                            <div className="w-24 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${match.confidence}%` }}
                                    className={cn(
                                        "h-full",
                                        match.prediction_hit ? "bg-emerald-500" : "bg-rose-500"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
