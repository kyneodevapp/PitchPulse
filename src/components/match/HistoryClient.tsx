"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PastMatch } from "@/lib/services/prediction";
import { SUPPORTED_LEAGUES } from "@/lib/constants";
import { ResultCard } from "./ResultCard";
import { CommandBar } from "./CommandBar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";


interface HistoryClientProps {
    initialMatches: PastMatch[];
}

export function HistoryClient({ initialMatches }: HistoryClientProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [activeLeagueId, setActiveLeagueId] = useState<number | null>(null);

    // Grouping by Date — memoised to avoid recomputation on every render
    const groupedByDate = useMemo(() => initialMatches.reduce((acc, match) => {
        const date = match.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {} as Record<string, PastMatch[]>), [initialMatches]);

    const sortedDates = useMemo(() => Object.keys(groupedByDate).sort((a, b) => {
        return new Date(groupedByDate[b][0].start_time).getTime() - new Date(groupedByDate[a][0].start_time).getTime();
    }), [groupedByDate]);

    // Stats
    const totalMatches = initialMatches.length;
    const totalHits = initialMatches.filter(m => m.prediction_hit).length;
    const hitRate = totalMatches > 0 ? Math.round((totalHits / totalMatches) * 100) : 0;

    useEffect(() => {
        if (sortedDates.length > 0 && !selectedDate) {
            setSelectedDate(sortedDates[0]);
        }
    }, [sortedDates, selectedDate]);

    const handleDateChange = useCallback((dateStr: string) => {
        setSelectedDate(dateStr);
        const element = document.getElementById(`history-date-${dateStr.replace(/\s+/g, '-')}`);
        if (element) {
            const yOffset = -140;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, []);

    return (
        <div className="space-y-6">
            <CommandBar
                selectedDate={selectedDate || ""}
                onDateChange={handleDateChange}
                availableDates={sortedDates}
                activeLeagueId={activeLeagueId}
                onLeagueChange={setActiveLeagueId}
                leagues={SUPPORTED_LEAGUES}
                isHistory={true}
                hitRate={hitRate}
            />

            {/* Match Results */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeLeagueId || "history-results"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-24"
                >
                    {sortedDates.map((dateStr) => {
                        const dateMatches = groupedByDate[dateStr];
                        const filteredMatches = activeLeagueId
                            ? dateMatches.filter(m => m.league_id === activeLeagueId)
                            : dateMatches;

                        if (filteredMatches.length === 0) return null;

                        return (
                            <div
                                key={dateStr}
                                id={`history-date-${dateStr.replace(/\s+/g, '-')}`}
                                className="scroll-mt-64 space-y-8"
                            >
                                {SUPPORTED_LEAGUES.map((league) => {
                                    const leagueMatches = filteredMatches.filter(m => m.league_id === league.id);
                                    if (leagueMatches.length === 0) return null;

                                    const leagueHits = leagueMatches.filter(m => m.prediction_hit).length;

                                    return (
                                        <div key={league.id} className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{league.name}</h4>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B0F14] border border-[#1F2937]">
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
                                Our algorithms are constantly tracking historical data.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
