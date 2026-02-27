/**
 * PitchPulse Edge Engine — ACCA Freeze Unit Tests
 *
 * Covers the ACCA builder, scoring, freeze value calculation,
 * and recommendation logic.
 */

import { describe, it, expect } from "vitest";
import {
    filterSafeLegs,
    filterFreezeLegs,
    buildAccas,
    scoreAcca,
    calculateFreezeValue,
    getFreezeRecommendation,
    type AccaLeg,
} from "../accaFreeze";
import type { MatchPrediction } from "../engine";

// ─── Helper: Create a mock MatchPrediction ──────────────────────────────────

function mkPrediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
    return {
        fixtureId: Math.floor(Math.random() * 100000),
        homeTeam: "Home FC",
        awayTeam: "Away United",
        homeLogo: "",
        awayLogo: "",
        leagueName: "Premier League",
        leagueId: 8,
        startTime: "2026-02-27T15:00:00Z",
        date: "2026-02-27",
        isLive: false,
        market: "Home Win",
        marketId: "result_home",
        probability: 0.65,
        impliedProbability: 0.60,
        odds: 1.60,
        bet365Odds: 1.55,
        bestBookmaker: "bet365",
        edge: 0.05,
        ev: 0.04,
        evAdjusted: 0.035,
        confidence: 72,
        edgeScore: 8.0,
        riskTier: "A",
        suggestedStake: 0.02,
        clvProjection: 2.5,
        simulationWinFreq: 6500,
        confidenceInterval: [0.58, 0.72] as [number, number],
        lambdaHome: 1.5,
        lambdaAway: 1.1,
        isLocked: false,
        ...overrides,
    };
}

// ─── Helper: Create a mock AccaLeg ──────────────────────────────────────────

function mkLeg(overrides: Partial<AccaLeg> = {}): AccaLeg {
    return {
        fixtureId: Math.floor(Math.random() * 100000),
        team: "Home FC",
        odds: 1.50,
        probability: 0.68,
        confidence: 72,
        startTime: "2026-02-27T15:00:00Z",
        leagueName: "Premier League",
        leagueId: 8,
        homeLogo: "",
        awayLogo: "",
        homeTeam: "Home FC",
        awayTeam: "Away United",
        status: "pending",
        isFreezeLeg: false,
        ...overrides,
    };
}

// =============================================================================
// filterSafeLegs
// =============================================================================

describe("filterSafeLegs", () => {
    it("returns only result_home/result_away markets", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 1.50 }),
            mkPrediction({ marketId: "result_away", odds: 1.80 }),
            mkPrediction({ marketId: "over_2.5", odds: 1.50 }),
            mkPrediction({ marketId: "btts_yes", odds: 1.60 }),
        ];
        const safe = filterSafeLegs(picks);
        expect(safe.length).toBe(2);
        expect(safe.every(l => !l.isFreezeLeg)).toBe(true);
    });

    it("returns only legs with odds between 1.30 and 2.00", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 1.10 }), // too low
            mkPrediction({ marketId: "result_home", odds: 1.50 }), // good
            mkPrediction({ marketId: "result_away", odds: 1.95 }), // good
            mkPrediction({ marketId: "result_home", odds: 2.50 }), // too high
        ];
        const safe = filterSafeLegs(picks);
        expect(safe.length).toBe(2);
    });

    it("excludes legs with edgeScore below 5.0", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 1.50, edgeScore: 3.0 }),
            mkPrediction({ marketId: "result_home", odds: 1.60, edgeScore: 8.0 }),
        ];
        const safe = filterSafeLegs(picks);
        expect(safe.length).toBe(1);
        expect(safe[0].odds).toBe(1.60);
    });

    it("enforces max 2 per league", () => {
        const picks = [
            mkPrediction({ fixtureId: 1, marketId: "result_home", odds: 1.50, leagueId: 8, probability: 0.70 }),
            mkPrediction({ fixtureId: 2, marketId: "result_home", odds: 1.60, leagueId: 8, probability: 0.65 }),
            mkPrediction({ fixtureId: 3, marketId: "result_away", odds: 1.70, leagueId: 8, probability: 0.60 }),
        ];
        const safe = filterSafeLegs(picks);
        expect(safe.length).toBe(2);
    });
});

// =============================================================================
// filterFreezeLegs
// =============================================================================

describe("filterFreezeLegs", () => {
    it("returns only odds between 2.50 and 20.50", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 1.50 }), // too low
            mkPrediction({ marketId: "result_away", odds: 3.00 }), // good
            mkPrediction({ marketId: "result_home", odds: 8.50 }), // good
            mkPrediction({ marketId: "result_away", odds: 25.0 }), // too high
        ];
        const freeze = filterFreezeLegs(picks);
        expect(freeze.length).toBe(2);
    });

    it("returns only WIN markets", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 4.00 }),
            mkPrediction({ marketId: "over_2.5", odds: 5.00 }),
        ];
        const freeze = filterFreezeLegs(picks);
        expect(freeze.length).toBe(1);
    });

    it("sorts by lowest probability first (hardest to hit)", () => {
        const picks = [
            mkPrediction({ marketId: "result_home", odds: 4.00, probability: 0.30 }),
            mkPrediction({ marketId: "result_away", odds: 8.00, probability: 0.12 }),
            mkPrediction({ marketId: "result_home", odds: 3.50, probability: 0.35 }),
        ];
        const freeze = filterFreezeLegs(picks);
        expect(freeze[0].probability).toBe(0.12);
    });
});

// =============================================================================
// scoreAcca
// =============================================================================

describe("scoreAcca", () => {
    it("computes combined odds as product of all leg odds", () => {
        const legs = [
            mkLeg({ odds: 1.45 }),
            mkLeg({ odds: 1.55 }),
            mkLeg({ odds: 1.65 }),
            mkLeg({ odds: 1.50 }),
            mkLeg({ odds: 5.20, isFreezeLeg: true }),
        ];
        const { combinedOdds } = scoreAcca(legs);
        const expected = 1.45 * 1.55 * 1.65 * 1.50 * 5.20;
        expect(combinedOdds).toBeCloseTo(expected, 1);
    });

    it("computes combined probability as product of all leg probs", () => {
        const legs = [
            mkLeg({ probability: 0.70 }),
            mkLeg({ probability: 0.65 }),
            mkLeg({ probability: 0.60 }),
            mkLeg({ probability: 0.68 }),
            mkLeg({ probability: 0.20, isFreezeLeg: true }),
        ];
        const { combinedProbability } = scoreAcca(legs);
        const expected = 0.70 * 0.65 * 0.60 * 0.68 * 0.20;
        expect(combinedProbability).toBeCloseTo(expected, 3);
    });
});

// =============================================================================
// buildAccas
// =============================================================================

describe("buildAccas", () => {
    it("returns empty array if fewer than 4 safe legs", () => {
        const safeLegs = [mkLeg(), mkLeg(), mkLeg()]; // only 3
        const freezeLegs = [mkLeg({ isFreezeLeg: true })];
        expect(buildAccas(safeLegs, freezeLegs)).toHaveLength(0);
    });

    it("returns empty array if no freeze legs", () => {
        const safeLegs = [mkLeg(), mkLeg(), mkLeg(), mkLeg()];
        expect(buildAccas(safeLegs, [])).toHaveLength(0);
    });

    it("returns combos with exactly 4 safe + 1 freeze", () => {
        const safeLegs = Array.from({ length: 5 }, (_, i) =>
            mkLeg({ fixtureId: i + 1, leagueId: i + 1 })
        );
        const freezeLegs = [mkLeg({ fixtureId: 100, leagueId: 99, isFreezeLeg: true })];

        const accas = buildAccas(safeLegs, freezeLegs, 2);
        expect(accas.length).toBeGreaterThan(0);

        for (const acca of accas) {
            const safe = acca.legs.filter(l => !l.isFreezeLeg);
            const freeze = acca.legs.filter(l => l.isFreezeLeg);
            expect(safe).toHaveLength(4);
            expect(freeze).toHaveLength(1);
        }
    });

    it("marks the freeze leg with isFreezeLeg: true", () => {
        const safeLegs = Array.from({ length: 4 }, (_, i) =>
            mkLeg({ fixtureId: i + 1, leagueId: i + 1 })
        );
        const freezeLegs = [mkLeg({ fixtureId: 100, leagueId: 99, isFreezeLeg: true })];

        const accas = buildAccas(safeLegs, freezeLegs, 1);
        const freezeLeg = accas[0].legs.find(l => l.isFreezeLeg);
        expect(freezeLeg).toBeDefined();
        expect(freezeLeg!.isFreezeLeg).toBe(true);
    });

    it("returns at most `count` accas", () => {
        const safeLegs = Array.from({ length: 6 }, (_, i) =>
            mkLeg({ fixtureId: i + 1, leagueId: i + 1 })
        );
        const freezeLegs = [mkLeg({ fixtureId: 100, leagueId: 99, isFreezeLeg: true })];

        const accas = buildAccas(safeLegs, freezeLegs, 2);
        expect(accas.length).toBeLessThanOrEqual(2);
    });
});

// =============================================================================
// calculateFreezeValue
// =============================================================================

describe("calculateFreezeValue", () => {
    it("returns 0 if any leg has lost", () => {
        const legs: AccaLeg[] = [
            mkLeg({ status: "won", odds: 1.45 }),
            mkLeg({ status: "lost", odds: 1.55 }),
            mkLeg({ status: "pending", odds: 1.65 }),
            mkLeg({ status: "pending", odds: 1.50 }),
            mkLeg({ status: "pending", odds: 5.20, isFreezeLeg: true }),
        ];
        expect(calculateFreezeValue(legs, 10)).toBe(0);
    });

    it("computes correctly with partial wins", () => {
        const legs: AccaLeg[] = [
            mkLeg({ status: "won", odds: 1.45 }),
            mkLeg({ status: "won", odds: 1.55 }),
            mkLeg({ status: "pending", odds: 1.65, probability: 0.63 }),
            mkLeg({ status: "pending", odds: 1.50, probability: 0.68 }),
            mkLeg({ status: "pending", odds: 5.20, probability: 0.19, isFreezeLeg: true }),
        ];
        const result = calculateFreezeValue(legs, 10);

        // stake(10) × won(1.45×1.55) × pending_prob(0.63×0.68×0.19)
        const expected = 10 * (1.45 * 1.55) * (0.63 * 0.68 * 0.19);
        expect(result).toBeCloseTo(expected, 1);
    });

    it("returns full payout when all legs have won", () => {
        const legs: AccaLeg[] = [
            mkLeg({ status: "won", odds: 1.45 }),
            mkLeg({ status: "won", odds: 1.55 }),
            mkLeg({ status: "won", odds: 1.65 }),
            mkLeg({ status: "won", odds: 1.50 }),
            mkLeg({ status: "won", odds: 5.20, isFreezeLeg: true }),
        ];
        const result = calculateFreezeValue(legs, 10);
        const expected = 10 * 1.45 * 1.55 * 1.65 * 1.50 * 5.20;
        expect(result).toBeCloseTo(expected, 1);
    });
});

// =============================================================================
// getFreezeRecommendation
// =============================================================================

describe("getFreezeRecommendation", () => {
    it("returns ACCA_DEAD when freeze value is 0", () => {
        expect(getFreezeRecommendation(0, 10)).toBe("ACCA_DEAD");
    });

    it("returns LET_IT_RIDE when freeze value < stake", () => {
        expect(getFreezeRecommendation(5, 10)).toBe("LET_IT_RIDE");
    });

    it("returns CONSIDER_FREEZING when freeze is between stake and 2x stake", () => {
        expect(getFreezeRecommendation(15, 10)).toBe("CONSIDER_FREEZING");
    });

    it("returns FREEZE_NOW when freeze value >= 2x stake", () => {
        expect(getFreezeRecommendation(25, 10)).toBe("FREEZE_NOW");
    });

    it("returns FREEZE_NOW at exactly 2x stake", () => {
        expect(getFreezeRecommendation(20, 10)).toBe("FREEZE_NOW");
    });
});
