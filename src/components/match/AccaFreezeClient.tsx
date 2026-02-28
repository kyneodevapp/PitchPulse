"use client";

import { useState } from "react";
import { Snowflake, ShieldCheck, Info } from "lucide-react";
import { LegList } from "@/components/match/LegList";
import { AccaBuilder } from "@/components/match/AccaBuilder";
import { AnimatePresence } from "framer-motion";
import type { AccaLeg } from "@/lib/engine/accaFreeze";

export function AccaFreezeClient({
    initialSafe,
    initialFreeze,
    meta
}: {
    initialSafe: AccaLeg[],
    initialFreeze: AccaLeg[],
    meta: any
}) {
    const [selectedSafe, setSelectedSafe] = useState<AccaLeg[]>([]);
    const [selectedFreeze, setSelectedFreeze] = useState<AccaLeg[]>([]);

    const handleToggleLeg = (leg: AccaLeg) => {
        const uniqueId = `${leg.fixtureId}-${leg.marketId}`;
        if (leg.isFreezeLeg) {
            setSelectedFreeze(prev => {
                const exists = prev.find(l => `${l.fixtureId}-${l.marketId}` === uniqueId);
                if (exists) return prev.filter(l => `${l.fixtureId}-${l.marketId}` !== uniqueId);
                if (prev.length >= 1) return [leg]; // Swap if 1 already selected
                return [...prev, leg];
            });
        } else {
            setSelectedSafe(prev => {
                const exists = prev.find(l => `${l.fixtureId}-${l.marketId}` === uniqueId);
                if (exists) return prev.filter(l => `${l.fixtureId}-${l.marketId}` !== uniqueId);
                if (prev.length >= 4) return prev; // Max 4 safes
                return [...prev, leg];
            });
        }
    };

    const handleRemoveFromBuilder = (uniqueId: string) => {
        setSelectedSafe(prev => prev.filter(l => `${l.fixtureId}-${l.marketId}` !== uniqueId));
        setSelectedFreeze(prev => prev.filter(l => `${l.fixtureId}-${l.marketId}` !== uniqueId));
    };

    const handleReset = () => {
        setSelectedSafe([]);
        setSelectedFreeze([]);
    };

    return (
        <div className="flex flex-col bg-[#0B0F14] min-h-screen pb-40">
            {/* Hero section */}
            <section className="container mx-auto px-4 pt-12 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            <Snowflake className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-4xl font-black text-white tracking-tighter">
                                    ACCA Freeze
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                                    V2.0 Beta
                                </span>
                            </div>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                5-Fold WIN Strategy <span className="w-1 h-1 rounded-full bg-neutral-800" /> SkyBet Optimized
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">{meta.safeLegsAvailable}</span>
                            <span>Safe Legs</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <Snowflake className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-400">{meta.freezeLegsAvailable}</span>
                            <span>Freeze Legs</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategy Hub */}
            <section className="container mx-auto px-4 mb-12">
                <div className="relative rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 p-6 md:p-8 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[100px] -mr-48 -mt-48 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700" />

                    <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                        <div className="max-w-xs">
                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Strategy Guide
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                                Build your 5-fold by selecting 4 high-probability "Safe Legs" and 1 high-odds "Freeze Leg". If the safes land, you profit even if the freeze leg loses (just freeze it on SkyBet).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:flex-1">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">01</div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Select 4 Safes</h4>
                                </div>
                                <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                                    Choose 4 high-probability wins (odds 1.20-2.00) from the left pool.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-xs">02</div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Select 1 Freeze</h4>
                                </div>
                                <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                                    Pick 1 underdog or draw (odds 2.50+) to freeze.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-black text-xs">03</div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Lock It In</h4>
                                </div>
                                <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                                    Input your 5 teams into SkyBet and use your "Acca Freeze" token on the 5th leg.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pools Section */}
            <section className="container mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Safe Pool */}
                    <div className="relative">
                        <div className="absolute top-0 right-0 py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 z-10">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">High Probability</span>
                        </div>
                        <LegList
                            title="Safe Leg Pool"
                            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                            iconColor="text-emerald-400"
                            legs={initialSafe}
                            selectedIds={selectedSafe.map(l => `${l.fixtureId}-${l.marketId}`)}
                            onToggle={handleToggleLeg}
                            type="safe"
                        />
                    </div>

                    {/* Freeze Pool */}
                    <div className="relative">
                        <div className="absolute top-0 right-0 py-1 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 z-10">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">High Upside</span>
                        </div>
                        <LegList
                            title="Freeze Leg Pool"
                            icon={<Snowflake className="w-4 h-4 text-cyan-400" />}
                            iconColor="text-cyan-400"
                            legs={initialFreeze}
                            selectedIds={selectedFreeze.map(l => `${l.fixtureId}-${l.marketId}`)}
                            onToggle={handleToggleLeg}
                            type="freeze"
                        />
                    </div>
                </div>
            </section>

            {/* Floating Acca Builder */}
            <AnimatePresence>
                {(selectedSafe.length > 0 || selectedFreeze.length > 0) && (
                    <AccaBuilder
                        selectedSafe={selectedSafe}
                        selectedFreeze={selectedFreeze}
                        onRemove={handleRemoveFromBuilder}
                        onReset={handleReset}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
