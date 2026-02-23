import { sportmonksService } from "@/lib/services/prediction";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { HistoryClient } from "@/components/match/HistoryClient";

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const pastFixtures = await sportmonksService.getPastFixtures(3);

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4">
                <div className="mb-16">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-bold text-white/40 hover:text-amber-400 transition-colors mb-8 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase">Prediction <span className="text-[#FBBF24]">History</span></h1>
                            <p className="text-white/40 max-w-2xl font-medium leading-relaxed">
                                Review our AI prediction accuracy over the last 3 days across all 9 major European leagues.
                                Track hits and misses to gauge model performance.
                            </p>
                        </div>
                        <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-6 py-4 shadow-lg group hover:border-amber-400/50 transition-colors">
                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] block mb-1">Period</span>
                            <span className="text-white font-bold text-lg">Last 3 Days</span>
                        </div>
                    </div>
                </div>

                <HistoryClient initialMatches={pastFixtures} />
            </div>
        </div>
    );
}
