"use client";

/**
 * Skeleton placeholder for AccaFreezeCard — shows animated pulse
 * while ACCA data loads. Matches AccaFreezeCard's layout.
 */
export function AccaFreezeCardSkeleton() {
    return (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1F2937] rounded-xl" />
                    <div>
                        <div className="h-5 w-36 bg-[#1F2937] rounded mb-1" />
                        <div className="h-3 w-24 bg-[#1F2937] rounded" />
                    </div>
                </div>
                <div className="h-10 w-20 bg-[#1F2937] rounded-lg" />
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-[#1F2937] rounded-full mb-4" />

            {/* Safe legs */}
            <div className="mb-4">
                <div className="h-3 w-20 bg-emerald-500/10 rounded mb-3" />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[#1F2937]/50 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-[#1F2937] rounded-full" />
                            <div>
                                <div className="h-4 w-28 bg-[#1F2937] rounded mb-1" />
                                <div className="h-2.5 w-40 bg-[#1F2937] rounded" />
                            </div>
                        </div>
                        <div className="h-5 w-12 bg-[#1F2937] rounded" />
                    </div>
                ))}
            </div>

            {/* Freeze leg */}
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 mb-4">
                <div className="h-3 w-20 bg-cyan-500/10 rounded mb-3" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-[#1F2937] rounded-full" />
                        <div>
                            <div className="h-4 w-36 bg-[#1F2937] rounded mb-1" />
                            <div className="h-2.5 w-44 bg-[#1F2937] rounded" />
                        </div>
                    </div>
                    <div className="h-5 w-12 bg-[#1F2937] rounded" />
                </div>
            </div>

            {/* Payout row */}
            <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-[#0B0F14] rounded-lg p-3 flex flex-col items-center gap-1">
                        <div className="h-2.5 w-16 bg-[#1F2937] rounded" />
                        <div className="h-5 w-14 bg-[#1F2937] rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
