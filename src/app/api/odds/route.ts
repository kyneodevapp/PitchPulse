import { NextResponse } from "next/server";
import { sportmonksService, PredictionStore } from "@/lib/services/prediction";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fixtureId = Number(searchParams.get("fixtureId"));
    const prediction = searchParams.get("prediction") || undefined;
    const homeTeam = searchParams.get("homeTeam") || undefined;
    const awayTeam = searchParams.get("awayTeam") || undefined;

    if (!fixtureId) {
        return NextResponse.json({ error: "Missing fixtureId" }, { status: 400 });
    }

    try {
        if (prediction) {
            const cached = await PredictionStore.get(fixtureId);
            const main = cached?.mainPrediction;

            const rawOdds = await sportmonksService.getOddsForPrediction(
                fixtureId, prediction, homeTeam, awayTeam
            );

            // Calculate Value Bet if we have team names
            let valueBet = null;
            if (homeTeam && awayTeam) {
                // If we have a cached result, use its candidates to ensure consistency
                const candidates = main?.candidates || sportmonksService.calculateBestPrediction(fixtureId, homeTeam, awayTeam).candidates;

                if (candidates) {
                    valueBet = await sportmonksService.calculateValueBet(fixtureId, candidates, homeTeam, awayTeam);

                    // If we have a cached main prediction, ensure the suggestedBet outcomes match if possible
                    // or at least prioritize the cached outcome if it's a high-confidence one.
                    if (main && !valueBet.isElite) {
                        // Optional: further logic to stick to 'main.outcome' if it's still valid
                    }
                }
            }

            return NextResponse.json({
                ...rawOdds,
                suggestedBet: valueBet
            });
        } else {
            const odds = await sportmonksService.getOddsComparison(fixtureId);
            return NextResponse.json({ all: odds, bet365: null, best: odds[0] || null });
        }
    } catch (error) {
        console.error("Odds API error:", error);
        return NextResponse.json({ bet365: null, best: null, all: [] });
    }
}
