// src/app/acca-freeze/page.tsx

import { sportmonksService } from "@/lib/services/prediction";
import { deriveWinPredictions } from "@/lib/engine/accaService";
import { filterSafeLegs, filterFreezeLegs } from "@/lib/engine/accaFreeze";
import { AccaFreezeClient } from "@/components/match/AccaFreezeClient";

export const revalidate = 600; // ISR: regenerate every 10 min
export const maxDuration = 60;

export const metadata = {
    title: "ACCA Freeze — PitchPulse",
    description: "Build your own custom 5-fold WIN accumulators optimized for SkyBet Acca Freeze.",
};

async function getAccaData() {
    try {
        const fixtures = await sportmonksService.getFixtures(3, true);
        const winPredictions = await deriveWinPredictions(fixtures);

        const safeLegs = filterSafeLegs(winPredictions);
        const freezeLegs = filterFreezeLegs(winPredictions);

        return {
            safeLegs,
            freezeLegs,
            meta: {
                totalPredictions: winPredictions.length,
                safeLegsAvailable: safeLegs.length,
                freezeLegsAvailable: freezeLegs.length,
                generatedAt: new Date().toISOString(),
            },
        };
    } catch (e) {
        console.error("[ACCA Freeze Page] Data error:", e);
        return {
            safeLegs: [],
            freezeLegs: [],
            meta: { totalPredictions: 0, safeLegsAvailable: 0, freezeLegsAvailable: 0, generatedAt: new Date().toISOString() }
        };
    }
}

export default async function AccaFreezePage() {
    const { safeLegs, freezeLegs, meta } = await getAccaData();

    return (
        <AccaFreezeClient
            initialSafe={safeLegs}
            initialFreeze={freezeLegs}
            meta={meta}
        />
    );
}
