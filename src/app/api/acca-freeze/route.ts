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

/**
 * For each fixture from the main engine pipeline, derive WIN market
 * (home_win / away_win) probabilities from its Poisson lambdas,
 * then fetch REAL bookmaker match-winner odds.
 *
 * This is needed because the engine picks ONE best market per match
 * (usually Over/Under or BTTS), but the ACCA Freeze system needs
 * WIN markets specifically.
 */
async function deriveWinPredictions(fixtures: Match[]): Promise<MatchPrediction[]> {
    const predictions: MatchPrediction[] = [];

    for (const f of fixtures) {
        const lambdaHome = f.lambda_home;
        const lambdaAway = f.lambda_away;
        if (!lambdaHome || !lambdaAway) continue;

        const scoreMatrix = buildScoreMatrix(lambdaHome, lambdaAway);
        const probs = deriveMarketProbabilities(scoreMatrix);

        // Odds fetching results for multiple markets
        const marketsToFetch = [
            { id: 'result_home', label: `${f.home_team} Win`, prob: probs.home_win },
            { id: 'result_away', label: `${f.away_team} Win`, prob: probs.away_win },
            { id: 'dnb_home', label: `${f.home_team} DNB`, prob: probs.dnb_home },
            { id: 'dnb_away', label: `${f.away_team} DNB`, prob: probs.dnb_away }
        ];

        for (const m of marketsToFetch) {
            if (m.prob < 0.10) continue;

            let odds = 0;
            try {
                const result = await sportmonksService.getOddsForPrediction(
                    f.id, m.label, f.home_team, f.away_team
                );
                odds = result.best?.odds || result.bet365 || 0;
            } catch (e) {
                console.warn(`[ACCA API] Odds fetch failed for ${m.label} (ID: ${f.id}):`, e);
            }

            // Fallback to fair odds if bookmaker odds are unavailable
            if (odds === 0 && m.prob > 0) {
                odds = Math.round((1 / m.prob) * 105) / 100; // Fair + 5% vig
            }

            if (odds > 0) {
                const impliedProb = 1 / odds;
                const edge = m.prob - impliedProb;

                predictions.push({
                    fixtureId: f.id,
                    homeTeam: f.home_team,
                    awayTeam: f.away_team,
                    homeLogo: f.home_logo,
                    awayLogo: f.away_logo,
                    leagueName: f.league_name,
                    leagueId: f.league_id,
                    startTime: f.start_time,
                    date: f.date,
                    isLive: f.is_live,
                    market: m.label,
                    marketId: m.id as any,
                    probability: m.prob,
                    impliedProbability: impliedProb,
                    odds: odds,
                    edge,
                    confidence: f.confidence || 65,
                    edgeScore: edge > 0 ? Math.round(edge * 100) : 5,
                    bet365Odds: null,
                    bestBookmaker: f.best_bookmaker || "",
                    ev: edge,
                    evAdjusted: edge,
                    clvProjection: 0,
                    simulationWinFreq: 0,
                    confidenceInterval: [0, 0],
                    lambdaHome,
                    lambdaAway,
                    isLocked: false,
                    suggestedStake: 0,
                    riskTier: "B",
                });
            }
        }
    }

    return predictions;
}

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
