import { Snowflake, ShieldCheck, Info } from "lucide-react";
import type { AccaFreeze } from "@/lib/engine/accaFreeze";
import { AccaFreezeCard } from "@/components/match/AccaFreezeCard";

export const revalidate = 600; // ISR: regenerate every 10 min
export const maxDuration = 60;

export const metadata = {
    title: "ACCA Freeze — PitchPulse",
    description:
        "Curated 5-fold WIN accumulators optimized for SkyBet Acca Freeze. 4 safe legs + 1 freeze leg for maximum edge.",
};

interface AccaFreezeApiResponse {
    accas: AccaFreeze[];
    meta: {
        totalPredictions: number;
        safeLegsAvailable: number;
        freezeLegsAvailable: number;
        generatedAt: string;
    };
}

async function fetchAccas(): Promise<AccaFreezeApiResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL
        : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    try {
        // Force bypass any stale Vercel Data Cache during this investigation
        const res = await fetch(`${baseUrl}/api/acca-freeze?t=${Date.now()}`, {
            cache: 'no-store',
            next: { revalidate: 0 },
        });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
    } catch (e) {
        console.error("[ACCA Freeze Page] Fetch error:", e);
        return { accas: [], meta: { totalPredictions: 0, safeLegsAvailable: 0, freezeLegsAvailable: 0, generatedAt: new Date().toISOString() } };
    }
}

export default async function AccaFreezePage() {
    const { accas, meta } = await fetchAccas();

    return (
        <div className="flex flex-col bg-[#0B0F14] min-h-screen">
            {/* Hero section */}
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

            {/* Strategy banner */}
            <section className="container mx-auto px-4 pb-8">
                <div className="rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 p-5">
                    <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">
                                How It Works
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-400">
                                <div className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-black text-xs mt-0.5">01</span>
                                    <p>
                                        <strong className="text-white">4 safe legs</strong> — high probability wins
                                        (odds 1.20–2.00) expected to land
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-400 font-black text-xs mt-0.5">02</span>
                                    <p>
                                        <strong className="text-white">1 freeze leg</strong> — harder pick (odds 2.50–20.50),
                                        freeze this on SkyBet
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-[#FBBF24] font-black text-xs mt-0.5">03</span>
                                    <p>
                                        <strong className="text-white">Profit if safes win</strong> — freeze leg is
                                        bonus upside. Big payout if it hits too
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ACCA Cards */}
            <section className="container mx-auto px-4 pb-24">
                {accas.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {accas.map((acca, i) => (
                            <AccaFreezeCard key={acca.id} acca={acca} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 px-8 rounded-xl border border-dashed border-cyan-400/20 text-center bg-cyan-400/5">
                        <Snowflake className="w-10 h-10 text-cyan-400/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                            No ACCA Available Today
                        </h3>
                        <p className="text-neutral-400 text-sm mb-2 max-w-md mx-auto">
                            The engine needs at least 4 qualifying safe legs (WIN markets, odds 1.20–2.00)
                            and 1 freeze leg (odds 2.50–20.50) to build an ACCA.
                        </p>
                        <p className="text-neutral-500 text-xs">
                            {meta.safeLegsAvailable} safe legs • {meta.freezeLegsAvailable} freeze legs available
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
