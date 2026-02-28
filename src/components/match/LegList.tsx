"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Snowflake, Clock, Check, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccaLeg } from "@/lib/engine/accaFreeze";

interface LegListProps {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    legs: AccaLeg[];
    selectedIds: string[];
    onToggle: (leg: AccaLeg) => void;
    type: "safe" | "freeze";
}

export function LegList({
    title,
    icon,
    iconColor,
    legs,
    selectedIds,
    onToggle,
    type
}: LegListProps) {
    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
                <div className={cn("p-1.5 rounded-lg bg-opacity-10", iconColor.replace('text-', 'bg-'))}>
                    {icon}
                </div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">
                    {title} <span className="text-neutral-500 ml-1">({legs.length})</span>
                </h2>
            </div>

            <div className="space-y-3">
                {legs.length > 0 ? (
                    legs.map((leg, i) => (
                        <LegItem
                            key={`${leg.fixtureId}-${leg.marketId}`}
                            leg={leg}
                            isSelected={selectedIds.includes(`${leg.fixtureId}-${leg.marketId}`)}
                            onToggle={() => onToggle(leg)}
                            index={i}
                            type={type}
                        />
                    ))
                ) : (
                    <div className="py-12 px-4 rounded-xl border border-dashed border-white/5 bg-white/[0.02] text-center">
                        <p className="text-xs text-neutral-500 font-medium">
                            No {type} legs available for current criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function LegItem({
    leg,
    isSelected,
    onToggle,
    index,
    type
}: {
    leg: AccaLeg;
    isSelected: boolean;
    onToggle: () => void;
    index: number;
    type: "safe" | "freeze";
}) {
    const kickoff = new Date(leg.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={onToggle}
            className={cn(
                "group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                isSelected
                    ? type === "safe"
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "bg-[#11151C] border-white/5 hover:border-white/10"
            )}
        >
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full",
                type === "safe" ? "bg-emerald-500" : "bg-cyan-500"
            )} />

            <div className="flex items-center gap-4 relative z-10">
                {/* Selection indicator */}
                <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                    isSelected
                        ? type === "safe"
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-cyan-500 border-cyan-500"
                        : "border-white/10 group-hover:border-white/30"
                )}>
                    {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate block uppercase tracking-tight">
                            {leg.homeTeam} vs {leg.awayTeam}
                        </span>
                        <div className="flex-1 border-t border-white/[0.03]" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            isSelected
                                ? type === "safe" ? "text-emerald-400" : "text-cyan-400"
                                : "text-neutral-400"
                        )}>
                            {leg.team} Win
                        </span>
                        <span className="text-[10px] text-neutral-600 font-bold">@</span>
                        <span className="text-sm font-black text-[#FBBF24]">
                            {leg.odds.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                        <Clock className="w-3 h-3 text-neutral-600" />
                        <span className="text-[10px] font-bold text-neutral-500">
                            {kickoff}
                        </span>
                    </div>
                    <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest block">
                        {leg.leagueName}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
