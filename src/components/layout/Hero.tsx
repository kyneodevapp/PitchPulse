"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Zap, Target, TrendingUp } from "lucide-react";

const STATS = [
    { label: "Win Rate", value: "84%", icon: Target },
    { label: "Daily Tips", value: "50+", icon: Zap },
    { label: "Accuracy", value: "92%", icon: TrendingUp },
    { label: "Leagues", value: "23", icon: ArrowLeftRight },
];

export function Hero() {
    return (
        <div className="relative pt-20 pb-10 md:pt-28 md:pb-12 overflow-hidden bg-[#0B0F14]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold tracking-[0.2em] text-[#FBBF24] uppercase bg-[#111827] border border-[#1F2937] rounded-lg">
                            AI-Powered Match Analysis
                        </span>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 tracking-tighter text-white leading-[1.1] md:leading-none">
                            Predict the Game with <br />
                            <span className="text-[#FBBF24]">
                                Surgical Precision
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                            PitchPulse uses advanced neural networks to analyze thousands of data points,
                            giving you the edge in every single match.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => document.getElementById('featured-games')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-12 py-5 rounded-xl bg-[#FBBF24] hover:bg-white transition-all text-black text-lg font-bold shadow-2xl uppercase tracking-widest"
                            >
                                Start Expert Predictions
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Stats strip — sits at the bottom of the hero as a border band */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12"
            >
                <div className="border-t border-b border-[#1F2937] grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1F2937]">
                    {STATS.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center justify-center gap-3 py-4 px-6 group hover:bg-white/[0.02] transition-colors">
                            <Icon className="w-4 h-4 text-amber-400/60 flex-shrink-0" />
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-black text-white tabular-nums">{value}</span>
                                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
