"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Filter, ChevronDown, Check } from "lucide-react";

interface League {
    id: number;
    name: string;
    country?: string;
}

interface CommandBarProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    availableDates: string[];
    activeLeagueId: number | null;
    onLeagueChange: (id: number | null) => void;
    leagues: readonly League[];
    isHistory?: boolean;
    hitRate?: number;
}

export function CommandBar({
    selectedDate,
    onDateChange,
    availableDates,
    activeLeagueId,
    onLeagueChange,
    leagues,
    isHistory = false,
    hitRate
}: CommandBarProps) {
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isLeagueOpen, setIsLeagueOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const activeLeague = leagues.find(l => l.id === activeLeagueId);

    // Quick Toggles logic
    const today = availableDates[0];
    const tomorrow = availableDates[1];

    return (
        <div className={cn(
            "sticky top-[64px] z-40 w-full transition-all duration-300",
            isScrolled ? "bg-[#111827]/95 shadow-2xl border-b border-[#1F2937]" : "bg-[#111827] border-b border-[#1F2937]"
        )}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14 md:h-16 gap-4">

                    {/* Left: Date Selector & Quick Toggles */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsDateOpen(!isDateOpen)}
                                aria-label="Select date"
                                aria-expanded={isDateOpen}
                                aria-haspopup="listbox"
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-white hover:border-[#FBBF24]/50 transition-colors group"
                            >
                                <CalendarIcon className="w-3.5 h-3.5 text-[#FBBF24]" />
                                <span className="text-xs md:text-sm font-bold whitespace-nowrap tabular-nums">
                                    {selectedDate}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-500 transition-transform", isDateOpen && "rotate-180")} />
                            </button>

                            {/* Date Dropdown */}
                            <AnimatePresence>
                                {isDateOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDateOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl z-50 py-2"
                                        >
                                            <div className="px-3 py-2 border-b border-[#1F2937] mb-2">
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Select Terminal Date</span>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto no-scrollbar">
                                                {availableDates.map((date, index) => (
                                                    <button
                                                        key={date}
                                                        onClick={() => {
                                                            onDateChange(date);
                                                            setIsDateOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all",
                                                            selectedDate === date ? "text-[#FBBF24] bg-[#0B0F14]" : "text-neutral-400 hover:text-white hover:bg-[#1F2937]"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {date}
                                                            {index === 0 && (
                                                                <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase border border-emerald-500/20">Today</span>
                                                            )}
                                                        </div>
                                                        {selectedDate === date && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick Toggles (Desktop only) */}
                        <div className="hidden sm:flex items-center gap-1.5 bg-[#0B0F14] p-1 rounded-lg border border-[#1F2937]">
                            <button
                                onClick={() => onDateChange(today)}
                                className={cn(
                                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                                    selectedDate === today ? "bg-[#1F2937] text-white" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => onDateChange(tomorrow)}
                                className={cn(
                                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                                    selectedDate === tomorrow ? "bg-[#1F2937] text-white" : "text-neutral-500 hover:text-white"
                                )}
                            >
                                Tomorrow
                            </button>
                        </div>
                    </div>

                    {/* Center: Active League (Desktop only) */}
                    <div className="hidden lg:block">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">
                            Active Market: <span className="text-white ml-2">{activeLeague?.name || "All Markets"}</span>
                        </span>
                    </div>

                    {/* Right: Filters / League Dropdown */}
                    <div className="flex items-center gap-3">
                        {isHistory && hitRate !== undefined && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0B0F14] border border-[#1F2937] rounded-lg">
                                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Hit Rate</span>
                                <span className={cn(
                                    "text-xs font-bold tabular-nums",
                                    hitRate >= 60 ? "text-emerald-400" : "text-amber-400"
                                )}>{hitRate}%</span>
                            </div>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setIsLeagueOpen(!isLeagueOpen)}
                                aria-label="Filter by league"
                                aria-expanded={isLeagueOpen}
                                aria-haspopup="listbox"
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border",
                                    activeLeagueId
                                        ? "bg-white border-white text-black"
                                        : "bg-[#0B0F14] border-[#1F2937] text-white hover:border-[#FBBF24]/50"
                                )}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                    {activeLeague?.name || "Filters"}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isLeagueOpen && "rotate-180")} />
                            </button>

                            {/* League Dropdown Component */}
                            <AnimatePresence>
                                {isLeagueOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsLeagueOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full right-0 mt-2 w-64 bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl z-50 py-2"
                                        >
                                            <div className="px-3 py-2 border-b border-[#1F2937] mb-2">
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Competition Markets</span>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto no-scrollbar">
                                                <button
                                                    onClick={() => {
                                                        onLeagueChange(null);
                                                        setIsLeagueOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all",
                                                        activeLeagueId === null ? "text-[#FBBF24] bg-[#0B0F14]" : "text-neutral-400 hover:text-white hover:bg-[#1F2937]"
                                                    )}
                                                >
                                                    All Markets
                                                    {activeLeagueId === null && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                {leagues.map((league) => (
                                                    <button
                                                        key={league.id}
                                                        onClick={() => {
                                                            onLeagueChange(league.id);
                                                            setIsLeagueOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all",
                                                            activeLeagueId === league.id ? "text-[#FBBF24] bg-[#0B0F14]" : "text-neutral-400 hover:text-white hover:bg-[#1F2937]"
                                                        )}
                                                    >
                                                        {league.name}
                                                        {activeLeagueId === league.id && <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
