import { NextResponse } from "next/server";
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
    try {
        // Fetch today's fixtures through the existing pipeline
        // This gives us lambdas, odds, and all engine data
        const fixtures: Match[] = await sportmonksService.getFixtures(3, true);

        // Derive WIN market predictions from lambdas + real bookmaker odds
        const winPredictions = await deriveWinPredictions(fixtures);

        // Filter into safe and freeze pools
        const safeLegs = filterSafeLegs(winPredictions);
        const freezeLegs = filterFreezeLegs(winPredictions);

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
