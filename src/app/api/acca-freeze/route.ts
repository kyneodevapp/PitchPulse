import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sportmonksService, Match } from "@/lib/services/prediction";
import type { MatchPrediction } from "@/lib/engine/engine";
import {
    buildScoreMatrix,
    deriveMarketProbabilities,
} from "@/lib/engine/poisson";
import {
    filterSafeLegs,
    filterFreezeLegs,
    buildAccas,
} from "@/lib/engine/accaFreeze";

export const revalidate = 600; // ISR: regenerate every 10 min

import { deriveWinPredictions } from "@/lib/engine/accaService";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const stripeStatus = user?.publicMetadata?.stripeStatus as string | undefined;
    const isVip = user?.publicMetadata?.isVip === true;
    const createdAt = user?.createdAt ?? 0;
    const isInTrial = (Date.now() - createdAt) < 7 * 24 * 60 * 60 * 1000;

    if (stripeStatus !== "active" && stripeStatus !== "trialing" && !isInTrial && !isVip) {
        return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    try {
        // Fetch today's fixtures through the existing pipeline
        // This gives us lambdas, odds, and all engine data
        const fixtures: Match[] = await sportmonksService.getFixtures(3, true);

        // Derive WIN market predictions from lambdas + real bookmaker odds
        const winPredictions = await deriveWinPredictions(fixtures);

        // Filter into safe and freeze pools - MUTUALLY EXCLUSIVE
        const safeLegs = filterSafeLegs(winPredictions);

        // Ensure matches in safe legs are NOT available for freeze legs
        const safeIds = new Set(safeLegs.map(l => l.fixtureId));
        const freezeCandidates = winPredictions.filter(p => !safeIds.has(p.fixtureId));

        const freezeLegs = filterFreezeLegs(freezeCandidates);

        // Build top 10 ACCAs
        const accas = buildAccas(safeLegs, freezeLegs, 10);

        return NextResponse.json({
            accas,
            meta: {
                totalFixtures: fixtures.length,
                winPredictions: winPredictions.length,
                safeLegsAvailable: safeLegs.length,
                freezeLegsAvailable: freezeLegs.length,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[ACCA Freeze API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate ACCA Freeze predictions", accas: [], meta: {} },
            { status: 500 }
        );
    }
}
