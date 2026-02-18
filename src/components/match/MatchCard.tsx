"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
                            <span className="text-white/40 font-black tracking-[0.2em] text-[10px] whitespace-nowrap">Best Bet</span>
                            <span className="text-purple-400 font-bold uppercase tracking-widest text-[10px] text-right line-clamp-1">{prediction}</span>
                        </div>

                        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence}%` }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">
                            <span>CONFIDENCE</span>
                            <span className="text-white/60">{confidence}%</span>
                        </div>
                    </div>
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
                date={date}
                time={time}
            />
        </>
    );
}
