"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Zap, Target, TrendingUp } from "lucide-react";

export function Hero() {
    return (
        <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 rounded-full">
                            AI-Powered Match Analysis
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white">
                            Predict the Game with <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-[length:200%_auto] animate-gradient">
                                Surgical Precision
                            </span>
                        </h1>
                        <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                            PitchPulse uses advanced neural networks to analyze thousands of data points,
                            giving you the edge in Every. Single. Match.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-all text-lg font-bold shadow-xl shadow-purple-500/25 text-white">
                                Start Expert Predictions
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
                    >
                        {[
                            { label: "Win Rate", value: "84%", icon: Target },
                            { label: "Daily Tips", value: "50+", icon: Zap },
                            { label: "Accuracy", value: "92%", icon: TrendingUp },
                            { label: "Markets", value: "120+", icon: ArrowLeftRight },
                        ].map((stat, i) => (
                            <div key={i} className="glass-dark p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <stat.icon className="w-6 h-6 text-purple-400 mb-3 mx-auto" />
                                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-xs font-medium text-white/40 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
