"use client";

import { motion } from "framer-motion";
import { Check, X as XIcon, Clock, ShieldAlert } from "lucide-react";
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col h-full"
        >
            <div className="p-6 flex-1">
                {/* Status + Hit/Miss Badge */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {match.date}
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        match.prediction_hit
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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

                {/* Teams + Score */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    {/* Home */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-2 relative flex items-center justify-center bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            {!homeError && match.home_logo ? (
                                <img
                                    src={match.home_logo}
                                    alt={match.home_team}
                                    className="w-full h-full object-contain p-2 filter drop-shadow-xl"
                                    onError={() => setHomeError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-white/10" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-white line-clamp-1">{match.home_team}</span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-white tabular-nums">{match.home_score}</span>
                            <span className="text-lg font-black text-white/20">-</span>
                            <span className="text-3xl font-black text-white tabular-nums">{match.away_score}</span>
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Full Time</span>
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-14 h-14 mb-2 relative flex items-center justify-center bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            {!awayError && match.away_logo ? (
                                <img
                                    src={match.away_logo}
                                    alt={match.away_team}
                                    className="w-full h-full object-contain p-2 filter drop-shadow-xl"
                                    onError={() => setAwayError(true)}
                                />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-white/10" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-white line-clamp-1">{match.away_team}</span>
                    </div>
                </div>

                {/* Prediction Info */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider gap-4">
                        <span className="text-white/40 font-black tracking-[0.2em] text-[10px] whitespace-nowrap">Our Prediction</span>
                        <span className={cn(
                            "font-bold uppercase tracking-widest text-[10px] text-right line-clamp-1",
                            match.prediction_hit ? "text-emerald-400" : "text-rose-400"
                        )}>{match.prediction}</span>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${match.confidence}%` }}
                            className={cn(
                                "absolute inset-y-0 left-0 rounded-full",
                                match.prediction_hit
                                    ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                    : "bg-gradient-to-r from-rose-600 to-rose-400"
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                        <span>Confidence</span>
                        <span className="text-white/60">{match.confidence}%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
