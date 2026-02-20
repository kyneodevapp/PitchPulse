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
                    backgroundColor: isScrolled ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.4)"
                }}
                className={cn(
                    "sticky top-[72px] z-30 -mx-4 px-4 backdrop-blur-3xl border-b border-white/5 transition-colors",
                    isScrolled ? "space-y-2" : "space-y-4"
                )}
            >
                {/* Stats Bar */}
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide no-scrollbar pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 flex-shrink-0">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Hit Rate</span>
                        <span className={cn(
                            "text-sm font-black",
                            hitRate >= 60 ? "text-emerald-400" : hitRate >= 40 ? "text-amber-400" : "text-rose-400"
                        )}>{hitRate}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Hits</span>
                        <span className="text-sm font-black text-emerald-400">{totalHits}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 flex-shrink-0">
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Misses</span>
                        <span className="text-sm font-black text-rose-400">{totalMatches - totalHits}</span>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide scroll-smooth no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
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
                                    "flex-shrink-0 flex flex-col items-center justify-center transition-all border overflow-hidden relative",
                                    isActive
                                        ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                                style={{
                                    width: isScrolled ? "44px" : "64px",
                                    height: isScrolled ? "44px" : "80px",
                                    borderRadius: isScrolled ? "10px" : "18px"
                                }}
                            >
                                {!isScrolled && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[9px] font-black uppercase tracking-widest mb-1"
                                    >
                                        {dayName.substring(0, 3)}
                                    </motion.span>
                                )}
                                <span className={cn(
                                    "font-black tracking-tighter",
                                    isScrolled ? "text-sm" : "text-lg"
                                )}>
                                    {dayNum}
                                </span>
                                {!isScrolled && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[9px] font-bold uppercase opacity-60"
                                    >
                                        {month}
                                    </motion.span>
                                )}
                                {/* Hit rate mini indicator */}
                                {!isScrolled && (
                                    <div className={cn(
                                        "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                                        dayHits / dayTotal >= 0.6 ? "bg-emerald-400" : dayHits / dayTotal >= 0.4 ? "bg-amber-400" : "bg-rose-400"
                                    )} />
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-24 pt-8"
                >
                    {sortedDates.map((dateStr) => {
                        const dateMatches = groupedByDate[dateStr];

                        return (
                            <div
                                key={dateStr}
                                id={`history-date-${dateStr.replace(/\s+/g, '-')}`}
                                className="scroll-mt-64 space-y-12"
                            >
                                {SUPPORTED_LEAGUES.map((league) => {
                                    const leagueMatches = dateMatches.filter(m => m.league_id === league.id);
                                    if (leagueMatches.length === 0) return null;

                                    const leagueHits = leagueMatches.filter(m => m.prediction_hit).length;

                                    return (
                                        <div key={league.id} className="space-y-8">
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Trophy className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">{league.name}</h4>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                                    leagueHits / leagueMatches.length >= 0.6
                                                        ? "text-emerald-400 bg-emerald-400/10"
                                                        : "text-amber-400 bg-amber-400/10"
                                                )}>
                                                    {leagueHits}/{leagueMatches.length} hits
                                                </span>
                                                <div className="flex-1 h-[1px] bg-white/5 ml-4" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        <div className="glass-dark rounded-[40px] p-24 text-center border border-white/5">
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">No Results Found</h3>
                            <p className="text-white/40 text-sm max-w-md mx-auto">
                                We couldn&apos;t find any completed matches across our supported leagues for the last 3 days.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
