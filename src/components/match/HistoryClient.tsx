"use client";

import { useState, useEffect } from "react";
import { PastMatch } from "@/lib/services/prediction";
import { ResultCard } from "./ResultCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface HistoryClientProps {
    initialMatches: PastMatch[];
}

const SUPPORTED_LEAGUES = [
    { id: 2, name: "Champions League", country: "Europe" },
    { id: 5, name: "Europa League", country: "Europe" },
    { id: 8, name: "Premier League", country: "England" },
    { id: 9, name: "Championship", country: "England" },
    { id: 564, name: "La Liga", country: "Spain" },
    { id: 567, name: "La Liga 2", country: "Spain" },
    { id: 82, name: "Bundesliga", country: "Germany" },
    { id: 384, name: "Serie A", country: "Italy" },
    { id: 387, name: "Serie B", country: "Italy" },
];

export function HistoryClient({ initialMatches }: HistoryClientProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Grouping by Date
    const groupedByDate = initialMatches.reduce((acc, match) => {
        const date = match.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {} as Record<string, PastMatch[]>);

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        return new Date(groupedByDate[b][0].start_time).getTime() - new Date(groupedByDate[a][0].start_time).getTime();
    });

    // Stats
    const totalMatches = initialMatches.length;
    const totalHits = initialMatches.filter(m => m.prediction_hit).length;
    const hitRate = totalMatches > 0 ? Math.round((totalHits / totalMatches) * 100) : 0;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (sortedDates.length > 0 && !selectedDate) {
            setSelectedDate(sortedDates[0]);
        }
    }, [sortedDates, selectedDate]);

    const scrollToDate = (dateStr: string) => {
        setSelectedDate(dateStr);
        const element = document.getElementById(`history-date-${dateStr.replace(/\s+/g, '-')}`);
        if (element) {
            const yOffset = isScrolled ? -120 : -220;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-12">
            {/* Sticky Header */}
            <motion.div
                animate={{
                    paddingTop: isScrolled ? "8px" : "16px",
                    paddingBottom: isScrolled ? "8px" : "16px",
                    backgroundColor: isScrolled ? "#0B0F14" : "transparent"
                }}
                className={cn(
                    "sticky top-[72px] z-30 -mx-4 px-4 border-b border-[#1F2937] transition-colors",
                    isScrolled ? "shadow-2xl" : ""
                )}
            >
                {/* Stats Bar */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3">
                    <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-1.5 flex-shrink-0">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Hit Rate</span>
                        <span className={cn(
                            "text-sm font-bold tabular-nums",
                            hitRate >= 60 ? "text-emerald-400" : hitRate >= 40 ? "text-amber-400" : "text-rose-400"
                        )}>{hitRate}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-1.5 flex-shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Hits</span>
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">{totalHits}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-lg px-3 py-1.5 flex-shrink-0">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Misses</span>
                        <span className="text-sm font-bold text-rose-400 tabular-nums">{totalMatches - totalHits}</span>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex overflow-x-auto gap-3 pb-1 scroll-smooth no-scrollbar">
                    {sortedDates.map((dateStr) => {
                        const isActive = selectedDate === dateStr;
                        const [dayName, dayNum, month] = dateStr.split(' ');
                        const dayHits = groupedByDate[dateStr].filter(m => m.prediction_hit).length;
                        const dayTotal = groupedByDate[dateStr].length;
                        return (
                            <button
                                key={dateStr}
                                onClick={() => scrollToDate(dateStr)}
                                className={cn(
                                    "flex-shrink-0 flex flex-col items-center justify-center transition-all border relative",
                                    isActive
                                        ? "bg-[#FBBF24] border-[#FBBF24] text-black font-bold"
                                        : "bg-[#111827] border-[#1F2937] text-neutral-400 hover:text-white"
                                )}
                                style={{
                                    width: isScrolled ? "48px" : "64px",
                                    height: isScrolled ? "48px" : "80px",
                                    borderRadius: "12px"
                                }}
                            >
                                {!isScrolled && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1 text-inherit">
                                        {dayName.substring(0, 3)}
                                    </span>
                                )}
                                <span className={cn(
                                    "font-bold tabular-nums",
                                    isScrolled ? "text-base" : "text-xl"
                                )}>
                                    {dayNum}
                                </span>
                                {/* Hit rate mini indicator */}
                                {!isScrolled && (
                                    <div className={cn(
                                        "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                                        dayHits / dayTotal >= 0.6 ? "bg-emerald-500" : dayHits / dayTotal >= 0.4 ? "bg-amber-500" : "bg-rose-500"
                                    )} title={`${dayHits}/${dayTotal} Hits`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Match Results */}
            <AnimatePresence mode="wait">
                <motion.div
                    key="history-results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-24"
                >
                    {sortedDates.map((dateStr) => {
                        const dateMatches = groupedByDate[dateStr];

                        return (
                            <div
                                key={dateStr}
                                id={`history-date-${dateStr.replace(/\s+/g, '-')}`}
                                className="scroll-mt-64 space-y-8"
                            >
                                {SUPPORTED_LEAGUES.map((league) => {
                                    const leagueMatches = dateMatches.filter(m => m.league_id === league.id);
                                    if (leagueMatches.length === 0) return null;

                                    const leagueHits = leagueMatches.filter(m => m.prediction_hit).length;

                                    return (
                                        <div key={league.id} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{league.name}</h4>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#111827] border border-[#1F2937]">
                                                    <span className={cn(
                                                        "text-[10px] font-bold tabular-nums",
                                                        leagueHits / leagueMatches.length >= 0.6 ? "text-emerald-400" : "text-amber-400"
                                                    )}>
                                                        {leagueHits}/{leagueMatches.length}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">HITS</span>
                                                </div>
                                                <div className="flex-1 h-[1px] bg-[#1F2937]" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {leagueMatches
                                                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                                    .map((m) => (
                                                        <ResultCard key={m.id} match={m} leagueName={league.name} />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {initialMatches.length === 0 && (
                        <div className="bg-[#111827] rounded-xl p-24 text-center border border-[#1F2937]">
                            <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">No Results Found</h3>
                            <p className="text-neutral-500 text-sm max-w-md mx-auto">
                                We couldn't find any completed matches across our supported leagues.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
