import { MatchCardSkeleton } from "@/components/match/MatchCardSkeleton";

/**
 * Next.js loading.tsx — automatically displayed by the framework
 * while the page.tsx async data fetch is in progress.
 * Renders skeleton cards so the user sees instant visual feedback.
 */
export default function Loading() {
    return (
        <div className="flex flex-col bg-[#0B0F14] min-h-screen">
            <section className="container mx-auto px-4 pt-12 pb-8">
                <div className="flex items-center gap-3 mb-4 animate-pulse">
                    <div className="w-48 h-12 bg-[#1F2937] rounded-lg" />
                </div>
            </section>
            <section className="container mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <MatchCardSkeleton key={i} />
                    ))}
                </div>
            </section>
        </div>
    );
}
