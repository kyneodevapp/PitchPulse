"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Shield, Trash2, TrendingUp, Sparkles, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccaLeg } from "@/lib/engine/accaFreeze";

interface AccaBuilderProps {
    selectedSafe: AccaLeg[];
    selectedFreeze: AccaLeg[];
    onRemove: (uniqueId: string) => void;
    onReset: () => void;
}

export function AccaBuilder({
    selectedSafe,
    selectedFreeze,
    onRemove,
    onReset
}: AccaBuilderProps) {
    const totalSelected = selectedSafe.length + selectedFreeze.length;
    const isReady = selectedSafe.length === 4 && selectedFreeze.length === 1;

    // Calculate combined odds
    const combinedOdds = [...selectedSafe, ...selectedFreeze].reduce(
        (prod, leg) => prod * leg.odds,
        1
    );

    if (totalSelected === 0) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4"
        >
            <div className="bg-[#0D1117]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="flex flex-col md:flex-row items-stretch md:items-center min-h-[80px]">

                    {/* Progress & Info */}
                    <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center shrink-0 md:min-w-[160px]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className={cn("w-3.5 h-3.5", isReady ? "text-[#FBBF24]" : "text-cyan-400")} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                Your Custom Acca
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Slots visualization */}
                            <div className="flex gap-1 mr-1">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={`safe-slot-${i}`}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                                            i < selectedSafe.length ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-white/5"
                                        )}
                                    />
                                ))}
                                <div
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full ml-0.5 transition-colors duration-300",
                                        selectedFreeze.length > 0 ? "bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]" : "bg-white/5"
                                    )}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                                {totalSelected}/5 Legs
                            </span>
                        </div>
                    </div>

                    {/* Selected Legs Preview - Level 3: Flex-Wrap for Total Visibility */}
                    <div className="flex-1 min-w-0 p-3 md:p-4">
                        <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                            <AnimatePresence mode="popLayout">
                                {[...selectedSafe, ...selectedFreeze].map((leg) => (
                                    <SelectedLegBadge
                                        key={`${leg.fixtureId}-${leg.marketId}`}
                                        leg={leg}
                                        onRemove={() => onRemove(`${leg.fixtureId}-${leg.marketId}`)}
                                    />
                                ))}
                            </AnimatePresence>

                            {totalSelected < 5 && (
                                <div className="px-3 py-1.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-2 shrink-0">
                                    <PlusIcon className="w-2.5 h-2.5 text-neutral-600" />
                                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                        Add Leg
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="p-4 md:p-5 bg-white/[0.03] border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-between md:justify-end gap-5 shrink-0">
                        <div className="text-right">
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-0.5">
                                Combined Odds
                            </span>
                            <span className={cn(
                                "text-xl font-black tabular-nums transition-colors",
                                isReady ? "text-[#FBBF24]" : "text-white"
                            )}>
                                @{combinedOdds.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onReset}
                                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all group"
                                title="Reset Selection"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => {
                                    if (isReady) {
                                        window.open('https://skybet.com/odds/accafreeze/cpn-ZvPjBBIAACMANFoX%2Fcv%2Fhome?d=ZyJefREAAB4AstY9', '_blank');
                                    }
                                }}
                                disabled={!isReady}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg",
                                    isReady
                                        ? "bg-cyan-500 text-white hover:bg-cyan-400 hover:shadow-cyan-500/20 active:scale-95"
                                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                )}
                            >
                                Build at SkyBet
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function SelectedLegBadge({ leg, onRemove }: { leg: AccaLeg; onRemove: () => void }) {
    return (
        <motion.div
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
                "group relative px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border shrink-0",
                leg.isFreezeLeg
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "bg-emerald-500/10 border-emerald-500/30"
            )}
        >
            <div className={cn(
                "p-1 rounded-md",
                leg.isFreezeLeg ? "bg-cyan-500/20" : "bg-emerald-500/20"
            )}>
                {leg.isFreezeLeg ? <Snowflake className="w-3 h-3 text-cyan-400" /> : <Shield className="w-3 h-3 text-emerald-400" />}
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white leading-none mb-0.5 truncate max-w-[80px] md:max-w-[120px]">
                    {leg.team}
                </span>
                <span className="text-[9px] font-bold text-neutral-500 leading-none">
                    @{leg.odds.toFixed(2)}
                </span>
            </div>

            <button
                onClick={onRemove}
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </motion.div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
