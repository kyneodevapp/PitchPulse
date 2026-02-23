"use client";

import { useState, useEffect } from "react";
import { Match } from "@/lib/services/prediction";
import { MatchCard } from "./MatchCard";
import { CommandBar } from "./CommandBar";
import { motion, AnimatePresence } from "framer-motion";

interface TodayGamesClientProps {
    initialMatches: Match[];
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

export function TodayGamesClient({ initialMatches }: TodayGamesClientProps) {
    const [activeLeagueId, setActiveLeagueId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Generate full 11-day range starting from today (today + next 10 days)
    const availableDates = Array.from({ length: 11 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' });
    });

    // Grouping by Date
    const groupedByDate = initialMatches.reduce((acc, match) => {
        const date = match.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    useEffect(() => {
        if (!selectedDate && availableDates.length > 0) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates, selectedDate]);

    const handleDateChange = (dateStr: string) => {
        setSelectedDate(dateStr);
        const element = document.getElementById(`date-section-${dateStr.replace(/\s+/g, '-')}`);
        if (element) {
            const yOffset = -140;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6">
            <CommandBar
                selectedDate={selectedDate || ""}
                onDateChange={handleDateChange}
                availableDates={availableDates}
                activeLeagueId={activeLeagueId}
                onLeagueChange={setActiveLeagueId}
                leagues={SUPPORTED_LEAGUES}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeLeagueId || "all"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-24"
                >
                    {availableDates.map((dateStr) => {
                        const dateMatches = groupedByDate[dateStr] || [];
                        const filteredMatches = activeLeagueId
                            ? dateMatches.filter(m => m.league_id === activeLeagueId)
                            : dateMatches;

                        return (
                            <div
                                key={dateStr}
                                id={`date-section-${dateStr.replace(/\s+/g, '-')}`}
                                className="scroll-mt-[180px] space-y-8"
                            >
                                {filteredMatches.length > 0 ? (
                                    SUPPORTED_LEAGUES.map((league) => {
                                        const leagueMatches = filteredMatches.filter(m => m.league_id === league.id);
                                        if (leagueMatches.length === 0) return null;

                                        return (
                                            <div key={league.id} className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{league.name}</h4>
                                                    <div className="flex-1 h-[1px] bg-[#1F2937]" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {leagueMatches.map((m) => (
                                                        <MatchCard
                                                            key={m.id}
                                                            id={m.id}
                                                            homeTeam={m.home_team}
                                                            awayTeam={m.away_team}
                                                            homeLogo={m.home_logo}
                                                            awayLogo={m.away_logo}
                                                            leagueName={league.name}
                                                            prediction={m.prediction || ""}
                                                            confidence={m.confidence || 0}
                                                            time={new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            date={m.date}
                                                            isLive={m.is_live}
                                                            isLocked={m.is_locked}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 px-6 rounded-xl border border-dashed border-[#1F2937] text-center">
                                        <p className="text-sm font-medium text-neutral-500">No predictions scheduled for this date.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {initialMatches.length === 0 && (
                        <div className="bg-[#111827] rounded-xl p-24 text-center border border-[#1F2937]">
                            <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">No Action Found</h3>
                            <p className="text-neutral-500 text-sm max-w-md mx-auto">
                                We couldn't find any matches across our supported leagues.
                                Our algorithms are scanning for the next big opportunity.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
