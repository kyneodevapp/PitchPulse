import { Hero } from "@/components/layout/Hero";
import { MatchCard } from "@/components/match/MatchCard";
import { sportmonksService, Match } from "@/lib/services/prediction";
import { BrandLogo } from "@/components/ui/BrandLogo";
import Link from "next/link";

export const revalidate = 120; // ISR: regenerate every 2 min
export const maxDuration = 60; // Allow up to 60s for heavy API pipeline on Vercel

export default async function Home() {
    // Fetch fixtures for the next 10 days (matches /games/today window)
    let fixtures: Match[] = [];
    try {
        fixtures = await sportmonksService.getFixtures(10);
    } catch (e) {
        console.error('[Home] getFixtures failed:', e);
    }

    // Edge Engine v3: Sort by Edge Score, filter to qualified picks only
    const qualifiedPicks = [...fixtures]
        .filter((f: Match) => f.edge_score && f.edge_score > 0 && (f.odds ?? 0) >= 1.80)
        .sort((a, b) => (b.edge_score || 0) - (a.edge_score || 0))
        .slice(0, 12); // Show top 12 by Edge Score

    const featuredMatches = qualifiedPicks.map((f: Match) => ({
        id: f.id,
        homeTeam: f.home_team,
        awayTeam: f.away_team,
        homeLogo: f.home_logo,
        awayLogo: f.away_logo,
        leagueName: f.league_name,
        prediction: f.prediction || "Analyzing...",
        confidence: f.confidence || 0,
        time: new Date(f.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: f.date,
        isLive: f.is_live,
        isLocked: f.is_locked,
        odds: f.odds,
        evAdjusted: f.ev_adjusted,
        edge: f.edge,
        edgeScore: f.edge_score,
        riskTier: f.risk_tier,
        suggestedStake: f.suggested_stake,
        clvProjection: f.clv_projection,
        simulationWinFreq: f.simulation_win_freq,
        impliedProbability: f.implied_probability,
        modelProbability: f.model_probability,
        ev: f.ev,
    }));


    return (
        <div className="flex flex-col bg-[#0B0F14]">
            <Hero />

            <section id="featured-games" className="container mx-auto px-4 py-24">
                <div className="flex items-end justify-between mb-12 border-b border-[#1F2937] pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">Edge Engine Active</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">Signal Dashboard</h2>
                        <p className="text-neutral-400 font-medium">One verified signal per match — ranked by composite Edge Score</p>
                    </div>
                    <Link
                        href="/games/today"
                        className="px-6 py-3 rounded-lg bg-[#111827] border border-[#1F2937] text-xs font-bold text-white uppercase tracking-widest hover:bg-[#1F2937] transition-all flex items-center gap-3 group"
                    >
                        View Full Terminal
                        <span className="group-hover:translate-x-1 transition-transform text-[#FBBF24]">→</span>
                    </Link>
                </div>

                {featuredMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredMatches.map((match, i) => (
                            <MatchCard key={i} {...match} />
                        ))}
                    </div>
                ) : (
                    <div className="py-16 px-8 rounded-xl border border-dashed border-amber-400/20 text-center bg-amber-400/5">
                        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">No Qualifying Signals</h3>
                        <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
                            The Edge Engine didn't find any matches passing all validation gates (EV ≥ 4%, Edge ≥ 3%, risk-approved).
                            Check the Terminal for the full pipeline output.
                        </p>
                        <Link
                            href="/games/today"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#111827] border border-[#1F2937] text-xs font-bold text-white uppercase tracking-widest hover:bg-[#1F2937] transition-all"
                        >
                            View Terminal <span className="text-blue-400">→</span>
                        </Link>
                    </div>
                )}
            </section>

            <section className="bg-[#111827] border-y border-[#1F2937] py-32">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-3xl mx-auto">
                        <span className="inline-block px-4 py-1 mb-8 text-[10px] font-bold tracking-[0.2em] text-[#FBBF24] uppercase border border-[#FBBF24]/30 rounded-lg">
                            Premium Access
                        </span>
                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">Ready to dominate?</h2>
                        <p className="text-neutral-400 mb-12 text-lg md:text-xl leading-relaxed font-medium">
                            Join 10,000+ elite analysts who use PitchPulse to gain a surgical edge.
                            Get started for free or upgrade to Pro for institutional-grade precision.
                        </p>
                        <button className="px-12 py-5 rounded-xl bg-[#FBBF24] text-black font-bold text-lg hover:bg-white transition-all uppercase tracking-widest shadow-2xl">
                            Unlock Pro Predictions
                        </button>
                    </div>
                </div>
            </section>

            <footer className="container mx-auto px-4 py-16 mt-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-[#1F2937]">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <BrandLogo size="md" showText={true} />
                        <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs text-center md:text-left">
                            Institutional Grade Football Analytics. Neural Network Driven Predictions.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12">
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Platform</span>
                            <div className="flex flex-col gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                                <a href="/games/today" className="hover:text-[#FBBF24] transition-colors">Markets</a>
                                <a href="/history" className="hover:text-[#FBBF24] transition-colors">Terminal</a>
                                <a href="#" className="hover:text-[#FBBF24] transition-colors">API</a>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Legal</span>
                            <div className="flex flex-col gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                                <a href="#" className="hover:text-[#FBBF24] transition-colors">Terms</a>
                                <a href="#" className="hover:text-[#FBBF24] transition-colors">Privacy</a>
                                <a href="#" className="hover:text-[#FBBF24] transition-colors">Risk</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-16 pt-8 border-t border-[#1F2937]/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-[0.3em]">© 2026 PitchPulse Technologies LLC</span>
                    <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-[0.3em]">All Rights Reserved</span>
                </div>
            </footer>
        </div>
    );
}
