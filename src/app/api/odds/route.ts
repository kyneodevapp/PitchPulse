import { NextResponse } from "next/server";
import { sportmonksService } from "@/lib/services/prediction";

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
        // Engine v2: Odds route is now READ-ONLY (no prediction overrides)
        if (prediction) {
            const rawOdds = await sportmonksService.getOddsForPrediction(
                fixtureId, prediction, homeTeam, awayTeam
            );
            return NextResponse.json(rawOdds);
        } else {
            const odds = await sportmonksService.getOddsComparison(fixtureId);
            return NextResponse.json({ all: odds, bet365: null, best: odds[0] || null });
        }
    } catch (error) {
        console.error("Odds API error:", error);
        return NextResponse.json({ bet365: null, best: null, all: [] });
    }
}
