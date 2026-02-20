import { Hero } from "@/components/layout/Hero";
import { MatchCard } from "@/components/match/MatchCard";
import { sportmonksService, Match } from "@/lib/services/prediction";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function Home() {
    // Fetch fixtures for the next 5 days
    const fixtures = await sportmonksService.getFixtures(5);

    // Filter for "Featured" - Let's take the first 6 sorted by time
    const featuredMatches = [...fixtures]
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 6)
        .map((f: Match) => ({
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
        }));

    return (
        <div className="flex flex-col">
            <Hero />

            <section className="container mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
                        <p className="text-white/40">Real-time AI insights for the most impactful matchups</p>
                    </div>
                    <Link
                        href="/games/today"
                        className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 group"
                    >
                        View All Games
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredMatches.map((match: any, i: number) => (
                        <MatchCard key={i} {...match} />
                    ))}
                </div>
            </section>

            <section className="bg-white/[0.02] border-y border-white/5 py-24">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-4xl font-bold text-white mb-6">Ready to beat the bookies?</h2>
                        <p className="text-white/60 mb-10 text-lg">
                            Join 10,000+ winners who use PitchPulse to gain a professional edge.
                            Get started for free or upgrade to Pro for surgical precision.
                        </p>
                        <button className="px-10 py-5 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all scale-100 hover:scale-105">
                            Unlock Pro Predictions
                        </button>
                    </div>
                </div>
            </section>

            <footer className="container mx-auto px-4 py-12 border-t border-white/5 mt-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center">
                            <span className="text-[10px] font-bold">P</span>
                        </div>
                        <span className="text-sm font-bold opacity-60">PitchPulse © 2026</span>
                    </div>
                    <div className="flex items-center gap-8 text-xs font-medium text-white/30 uppercase tracking-widest">
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
