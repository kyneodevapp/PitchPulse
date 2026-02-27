"use client";

/**
 * Skeleton placeholder for MatchCard — shows animated pulse
 * while real match data loads. Matches MatchCard's layout.
 */
export function MatchCardSkeleton() {
    return (
        <div className="relative bg-[#111827] border border-[#1F2937] rounded-2xl p-6 animate-pulse">
            {/* Header badges */}
            <div className="flex items-center gap-2 mb-5">
                <div className="h-5 w-8 bg-[#1F2937] rounded-full" />
                <div className="h-5 w-12 bg-[#1F2937] rounded-full" />
                <div className="ml-auto h-4 w-32 bg-[#1F2937] rounded" />
            </div>

            {/* Teams row */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 bg-[#1F2937] rounded-full" />
                    <div className="h-3 w-20 bg-[#1F2937] rounded" />
                </div>
                <div className="h-5 w-6 bg-[#1F2937] rounded" />
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 bg-[#1F2937] rounded-full" />
                    <div className="h-3 w-20 bg-[#1F2937] rounded" />
                </div>
            </div>

            {/* Signal row */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="h-3 w-16 bg-[#1F2937] rounded mb-2" />
                    <div className="h-5 w-32 bg-[#1F2937] rounded" />
                </div>
                <div className="text-right">
                    <div className="h-3 w-10 bg-[#1F2937] rounded mb-2 ml-auto" />
                    <div className="h-6 w-16 bg-[#1F2937] rounded ml-auto" />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-[#0B0F14] rounded-lg p-3 flex flex-col items-center gap-1">
                        <div className="h-2.5 w-14 bg-[#1F2937] rounded" />
                        <div className="h-4 w-10 bg-[#1F2937] rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
