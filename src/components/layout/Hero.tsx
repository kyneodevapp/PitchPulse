"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Zap, Target, TrendingUp } from "lucide-react";

export function Hero() {
    return (
        <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-[#0B0F14]">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold tracking-[0.2em] text-[#FBBF24] uppercase bg-[#111827] border border-[#1F2937] rounded-lg">
                            AI-Powered Match Analysis
                        </span>
                        <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter text-white leading-none">
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

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { label: "Win Rate", value: "84%", icon: Target },
                            { label: "Daily Tips", value: "50+", icon: Zap },
                            { label: "Accuracy", value: "92%", icon: TrendingUp },
                            { label: "Markets", value: "120+", icon: ArrowLeftRight },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#111827] p-8 rounded-xl border border-[#1F2937] hover:border-amber-400/50 transition-colors shadow-lg group">
                                <stat.icon className="w-6 h-6 text-[#FBBF24] mb-4 mx-auto group-hover:scale-110 transition-transform" />
                                <div className="text-3xl font-bold text-white mb-1 tabular-nums tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
