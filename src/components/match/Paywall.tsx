"use client";

import { motion } from "framer-motion";
import { Lock, Zap, ShieldCheck, TrendingUp } from "lucide-react";

interface PaywallProps {
    onUpgrade: () => void;
}

export function Paywall({ onUpgrade }: PaywallProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 relative"
            >
                <Lock className="w-8 h-8 text-purple-500" />
                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full -z-10" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">
                Trial <span className="text-purple-500 text-glow">Expired</span>
            </h2>

            <p className="text-white/40 max-w-lg mx-auto mb-10 text-sm font-medium leading-relaxed">
                Your 7-day surgical access has come to an end. Subscribe to <span className="text-white font-bold">PitchPulse Pro</span> to unlock unlimited AI deep-dives, market signals, and pro match analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 w-full max-w-2xl">
                {[
                    { label: "15+ Markets", icon: TrendingUp },
                    { label: "Surgical Odds", icon: Zap },
                    { label: "AI Signals", icon: ShieldCheck },
                ].map((item, idx) => (
                    <div key={idx} className="glass-dark border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <item.icon className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onUpgrade}
                className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-all text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/20 text-white"
            >
                <span className="relative z-10 flex items-center gap-2">
                    Unlock Full Access — £8.99/mo
                </span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            </button>

            <p className="mt-8 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                Cancel anytime • Instant access
            </p>
        </div>
    );
}
