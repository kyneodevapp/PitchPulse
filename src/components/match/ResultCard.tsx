"use client";

import { motion } from "framer-motion";
import { Check, X as XIcon, Clock, ShieldAlert, Lock } from "lucide-react";
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
            className="bg-[#111827] rounded-xl overflow-hidden border border-[#1F2937] hover:border-amber-400/50 transition-colors duration-200 flex flex-col h-full shadow-lg"
        >
            <div className="p-5 flex-1">
                {/* Status + Hit/Miss Badge */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0B0F14] text-neutral-400 border border-[#1F2937] text-[10px] font-bold uppercase tracking-widest tabular-nums">
                            <Clock className="w-3 h-3" />
                            {match.date}
                        </div>
                        {match.is_locked && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold uppercase tracking-widest shadow-sm">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                        match.prediction_hit
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                    )}>
                        {match.prediction_hit ? (
                            <>
                                <Check className="w-2.5 h-2.5" />
                                Hit
                            </>
                        ) : (
                            <>
                                <XIcon className="w-2.5 h-2.5" />
                                Miss
                            </>
                        )}
                    </div>
                </div>

                {/* Teams + Score */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    {/* Home */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-lg overflow-hidden border border-[#1F2937]">
                            {!homeError && match.home_logo ? (
                                <img
                                    src={match.home_logo}
                                    alt={match.home_team}
                                    className="w-full h-full object-contain p-2"
                                    onError={() => setHomeError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-[#1F2937]" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-white tracking-tight line-clamp-1">{match.home_team}</span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white tabular-nums">{match.home_score}</span>
                            <span className="text-lg font-bold text-[#1F2937]">-</span>
                            <span className="text-2xl font-bold text-white tabular-nums">{match.away_score}</span>
                        </div>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">FT</span>
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-12 h-12 mb-2 relative flex items-center justify-center bg-[#0B0F14] rounded-lg overflow-hidden border border-[#1F2937]">
                            {!awayError && match.away_logo ? (
                                <img
                                    src={match.away_logo}
                                    alt={match.away_team}
                                    className="w-full h-full object-contain p-2"
                                    onError={() => setAwayError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-[#1F2937]" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-white tracking-tight line-clamp-1">{match.away_team}</span>
                    </div>
                </div>

                {/* Prediction Info */}
                <div className="space-y-3 pt-4 border-t border-[#1F2937]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-neutral-500 font-bold tracking-widest text-[9px] uppercase whitespace-nowrap">MARKET PICK</span>
                        <span className={cn(
                            "font-bold uppercase tracking-widest text-[10px] text-right line-clamp-1",
                            match.prediction_hit ? "text-emerald-400" : "text-rose-400"
                        )}>{match.prediction}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                        <span>CONFIDENCE</span>
                        <span className="text-white font-bold tabular-nums">{match.confidence}%</span>
                    </div>

                    <div className="relative h-1.5 w-full bg-[#0B0F14] rounded-full overflow-hidden border border-[#1F2937]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${match.confidence}%` }}
                            className={cn(
                                "absolute inset-y-0 left-0",
                                match.prediction_hit ? "bg-emerald-500" : "bg-rose-500"
                            )}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
