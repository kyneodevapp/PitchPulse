import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MarketAnalysis } from "@/lib/services/prediction";

interface MarketGridProps {
    markets: MarketAnalysis[];
}

export function MarketGrid({ markets }: MarketGridProps) {
    const outcomeMarkets = markets.filter(m => ["Fulltime Result", "Double Chance", "Draw No Bet", "Asian Handicap"].includes(m.marketName));
    const goalMarkets = markets.filter(m => ["Over/Under", "BTTS", "Total Goals/BTTS", "Team Total Goals", "1st Half Goals", "Goal Line"].includes(m.marketName));
    const advancedMarkets = markets.filter(m => ["Correct Score", "First Team To Score", "Result/BTTS", "Half Time Result", "HT/FT"].includes(m.marketName));

    const categoryInsights: Record<string, string> = {
        "Match Outcome": "Model favors home resilience but sees draw probability rising in low-tempo matches.",
        "Goals": "Aggressive pressing data suggests high likelihood of BTTS despite low recent scorelines.",
        "Advanced": "High volatility in late-game signals makes 'Result / BTTS' the higher value expert play."
    };

    const renderGroup = (title: string, items: MarketAnalysis[]) => (
        <div className="space-y-8">
            <div className="flex items-center gap-4 px-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">{title}</h4>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {items.map((market, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative group overflow-hidden"
                    >
                        {/* Frosted Glass Card */}
                        <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-[24px] p-6 hover:bg-white/[0.06] transition-all relative z-10">
                            {/* Neon Edge Glow */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] pointer-events-none",
                                market.probability > 85 ? "shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] border-emerald-500/30" :
                                    market.confidenceLevel === "High" ? "shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] border-emerald-500/20" :
                                        market.confidenceLevel === "Medium" ? "shadow-[inset_0_0_15px_rgba(245,158,11,0.05)] border-amber-500/20" :
                                            "shadow-[inset_0_0_15px_rgba(244,63,94,0.05)] border-rose-500/20"
                            )} />

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{market.marketName}</span>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    market.probability > 85 ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                                        market.confidenceLevel === "High" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                            market.confidenceLevel === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                    {market.probability > 85 ? "Elite High" : market.confidenceLevel}
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <span className="block text-[10px] font-bold text-white/20 uppercase tracking-tighter mb-1">AI PICK</span>
                                    <span className="text-lg font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">
                                        {market.prediction}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold text-white/20 uppercase tracking-tighter mb-1">PROBABILITY</span>
                                    <span className="text-2xl font-black text-white italic tracking-tighter">
                                        {market.probability}%
                                    </span>
                                </div>
                            </div>

                            {/* Animated Probability Bar */}
                            <div className="space-y-3">
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${market.probability}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn(
                                            "h-full rounded-full",
                                            market.probability > 85 ? "bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                                                market.confidenceLevel === "High" ? "bg-emerald-500" :
                                                    market.confidenceLevel === "Medium" ? "bg-amber-500" :
                                                        "bg-rose-500"
                                        )}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-white/40">{market.contextualStat}</span>
                                    <span className="text-white/20 italic">{market.microDetail}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Insight Summary Row */}
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center gap-4">
                <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                    AI Category Insight
                </div>
                <p className="text-xs font-medium text-white/60 italic leading-relaxed text-center md:text-left">
                    "{categoryInsights[title]}"
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-24">
            {outcomeMarkets.length > 0 && renderGroup("Match Outcome", outcomeMarkets)}
            {goalMarkets.length > 0 && renderGroup("Goals", goalMarkets)}
            {advancedMarkets.length > 0 && renderGroup("Advanced", advancedMarkets)}
        </div>
    );
}
