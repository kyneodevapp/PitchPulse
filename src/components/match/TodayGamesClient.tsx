"use client";

import { useState, useRef, useEffect } from "react";
import { Match } from "@/lib/services/prediction";
import { MatchCard } from "./MatchCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar as CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react";

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
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Grouping by Date
    const groupedByDate = initialMatches.reduce((acc, match) => {
        const date = match.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        return new Date(groupedByDate[a][0].start_time).getTime() - new Date(groupedByDate[b][0].start_time).getTime();
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
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
        const element = document.getElementById(`date-section-${dateStr.replace(/\s+/g, '-')}`);
        if (element) {
            const yOffset = isScrolled ? -120 : -220;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-12">
            {/* Unified Sticky Header for Navigation */}
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
                {/* 1. Date Navigation (Calendar) */}
                <div className="relative">
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide scroll-smooth no-scrollbar"
                        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                        {sortedDates.map((dateStr) => {
                            const isActive = selectedDate === dateStr;
                            const [dayName, dayNum, month] = dateStr.split(' ');
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => scrollToDate(dateStr)}
                                    className={cn(
                                        "flex-shrink-0 flex flex-col items-center justify-center transition-all border overflow-hidden",
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
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. League Navigation */}
                <div className="flex overflow-x-auto gap-2 scrollbar-hide no-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <motion.button
                        layout
                        onClick={() => setActiveLeagueId(null)}
                        className={cn(
                            "rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border flex-shrink-0 px-4",
                            activeLeagueId === null
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                        )}
                        style={{ height: isScrolled ? "28px" : "36px" }}
                    >
                        All
                    </motion.button>
                    {SUPPORTED_LEAGUES.map((league) => (
                        <motion.button
                            layout
                            key={league.id}
                            onClick={() => setActiveLeagueId(league.id)}
                            className={cn(
                                "rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border flex items-center gap-2 flex-shrink-0 px-4",
                                activeLeagueId === league.id
                                    ? "bg-white/10 border-white/20 text-white"
                                    : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                            )}
                            style={{ height: isScrolled ? "28px" : "36px" }}
                        >
                            {league.name}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeLeagueId || "all"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-24 pt-8"
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
                                id={`date-section-${dateStr.replace(/\s+/g, '-')}`}
                                className="scroll-mt-64 space-y-12"
                            >
                                {/* League Grouping within this Date */}
                                {SUPPORTED_LEAGUES.map((league) => {
                                    const leagueMatches = filteredMatches.filter(m => m.league_id === league.id);
                                    if (leagueMatches.length === 0) return null;

                                    const sortedLeagueMatches = [...leagueMatches].sort((a, b) =>
                                        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                                    );

                                    return (
                                        <div key={league.id} className="space-y-8">
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Trophy className="w-4 h-4" />
                                                </div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">{league.name}</h4>
                                                <div className="flex-1 h-[1px] bg-white/5 ml-4" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {sortedLeagueMatches.map((m) => (
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
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {initialMatches.length === 0 && (
                        <div className="glass-dark rounded-[40px] p-24 text-center border border-white/5">
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">No Action Found</h3>
                            <p className="text-white/40 text-sm max-w-md mx-auto">
                                We couldn't find any matches across our supported leagues for the next few days.
                                Our algorithms are scanning for the next big opportunity.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
