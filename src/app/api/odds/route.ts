import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { sportmonksService } from "@/lib/services/prediction";

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await currentUser();
    const stripeStatus = user?.publicMetadata?.stripeStatus as string | undefined;
    const createdAt = user?.createdAt ?? 0;
    // const isInTrial = (Date.now() - createdAt) < 7 * 24 * 60 * 60 * 1000;

    // TEMPORARY: Allow all authenticated users
    // if (stripeStatus !== "active" && !isInTrial) {
    //     return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    // }

    // Rate limit: 60 odds requests per user per minute
    const rl = rateLimit(`odds:${userId}`, { limit: 60, windowMs: 60_000 });
    if (!rl.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please wait before retrying." },
            {
                status: 429,
                headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
            }
        );
    }

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
            return NextResponse.json(rawOdds, {
                headers: {
                    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                    "CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                },
            });
        } else {
            const odds = await sportmonksService.getOddsComparison(fixtureId);
            return NextResponse.json({ all: odds, bet365: null, best: odds[0] || null }, {
                headers: {
                    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                    "CDN-Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
                },
            });
        }
    } catch (error) {
        console.error("Odds API error:", error);
        return NextResponse.json({ bet365: null, best: null, all: [] });
    }
}
