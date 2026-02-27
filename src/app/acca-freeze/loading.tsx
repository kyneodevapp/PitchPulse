import { AccaFreezeCardSkeleton } from "@/components/match/AccaFreezeCardSkeleton";
import { Snowflake, Info } from "lucide-react";

/**
 * Next.js loading.tsx — automatically displayed by the framework
 * while the ACCA Freeze page.tsx async data fetch is in progress.
 */
export default function Loading() {
    return (
        <div className="flex flex-col bg-[#0B0F14] min-h-screen">
            {/* Hero section (static — renders instantly) */}
            <section className="container mx-auto px-4 pt-12 pb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                        <Snowflake className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">
                            ACCA Freeze
                        </h1>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                            5-Fold • Win Only • SkyBet Optimized
                        </p>
                    </div>
                </div>
            </section>

            {/* Strategy banner (static) */}
            <section className="container mx-auto px-4 pb-8">
                <div className="rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">
                                Loading ACCAs...
                            </h3>
                            <p className="text-sm text-neutral-400">
                                Scanning 15 leagues for qualifying WIN markets. This may take a moment.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Skeleton cards */}
            <section className="container mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <AccaFreezeCardSkeleton key={i} />
                    ))}
                </div>
            </section>
        </div>
    );
}
