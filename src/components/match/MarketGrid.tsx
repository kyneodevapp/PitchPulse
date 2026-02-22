import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MarketAnalysis } from "@/lib/services/prediction";

interface MarketGridProps {
    markets: MarketAnalysis[];
}

export function MarketGrid({ markets }: MarketGridProps) {
    const outcomeMarkets = markets.filter(m => ["Fulltime Result", "Double Chance", "Draw No Bet", "Asian Handicap", "Half Time Result", "HT/FT"].includes(m.marketName));
    const ouGoalsMarkets = markets.filter(m => ["Over/Under", "Goal Line", "1st Half Goals"].includes(m.marketName));
    const teamGoalsMarkets = markets.filter(m => ["Team Total Goals", "First Team To Score", "BTTS"].includes(m.marketName));
    const advancedMarkets = markets.filter(m => ["Correct Score", "Result/BTTS", "Total Goals/BTTS"].includes(m.marketName));

    const categoryInsights: Record<string, string> = {
        "Match Outcome": "Model favors home resilience but sees draw probability rising in low-tempo matches.",
        "Over/Under Goals": "Match-wide volume data suggests active final thirds with high likelihood of multi-goal breakthroughs.",
        "Team Goals": "Team-specific xG spikes indicate strong offensive conversion rates for clinical finishes.",
        "Advanced Analysis": "Complex market signals show high value in combined outcomes for strategic precision."
    };

    const renderGroup = (title: string, items: MarketAnalysis[]) => (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{title}</h4>
                <div className="h-[1px] flex-1 bg-[#1F2937]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((market, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group"
                    >
                        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-amber-400/50 transition-colors relative z-10 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{market.marketName}</span>
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-white",
                                    market.probability > 85 ? "bg-emerald-600" :
                                        market.confidenceLevel === "High" ? "bg-emerald-600" :
                                            market.confidenceLevel === "Medium" ? "bg-amber-600" :
                                                "bg-rose-600"
                                )}>
                                    {market.probability > 85 ? "Elite" : market.confidenceLevel}
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">AI PICK</span>
                                    <span className="text-lg font-bold text-white uppercase tracking-tight">
                                        {market.prediction}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">PROBABILITY</span>
                                    <span className="text-2xl font-bold text-white tracking-tighter tabular-nums">
                                        {market.probability}%
                                    </span>
                                </div>
                            </div>

                            {/* Probability Bar */}
                            <div className="space-y-3">
                                <div className="h-1.5 w-full bg-[#0B0F14] rounded-full overflow-hidden border border-[#1F2937]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${market.probability}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn(
                                            "h-full",
                                            market.probability > 85 ? "bg-emerald-500" :
                                                market.confidenceLevel === "High" ? "bg-emerald-500" :
                                                    market.confidenceLevel === "Medium" ? "bg-amber-500" :
                                                        "bg-rose-500"
                                        )}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-neutral-500 uppercase tracking-widest">{market.contextualStat}</span>
                                    <span className="text-neutral-600 italic">{market.microDetail}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* AI Insight Summary Row */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] flex flex-col md:flex-row items-center gap-4">
                <div className="px-2 py-1 rounded bg-[#0B0F14] border border-[#1F2937] text-[9px] font-bold text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                    ANALYSIS
                </div>
                <p className="text-xs font-medium text-neutral-400 italic leading-relaxed text-center md:text-left">
                    "{categoryInsights[title]}"
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-16">
            {outcomeMarkets.length > 0 && renderGroup("Match Outcome", outcomeMarkets)}
            {ouGoalsMarkets.length > 0 && renderGroup("Over/Under Goals", ouGoalsMarkets)}
            {teamGoalsMarkets.length > 0 && renderGroup("Team Goals", teamGoalsMarkets)}
            {advancedMarkets.length > 0 && renderGroup("Advanced Analysis", advancedMarkets)}
        </div>
    );
}
