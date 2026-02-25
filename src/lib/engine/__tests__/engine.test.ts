/**
 * PitchPulse Edge Engine — Unit Tests
 *
 * Covers the pure mathematical modules that form the prediction pipeline.
 * All functions tested here are side-effect-free and deterministic.
 */

import { describe, it, expect } from "vitest";

// ─── Poisson ──────────────────────────────────────────────────────────────────
import {
    poissonPMF,
    poissonDistribution,
    applyFatigueAdjustment,
    applyInjuryWeight,
    buildScoreMatrix,
    deriveMarketProbabilities,
    getLeagueHomeAdvantage,
} from "../poisson";

// ─── Kelly ────────────────────────────────────────────────────────────────────
import { computeKellyStake } from "../kelly";

// ─── Edge Score ───────────────────────────────────────────────────────────────
import { computeEdgeScore } from "../edgeScore";

// ─── CLV ──────────────────────────────────────────────────────────────────────
import { predictCLV, type CLVProjection } from "../clv";

// ─── Validation ───────────────────────────────────────────────────────────────
import { areCorrelated } from "../validation";

// =============================================================================
// POISSON PMF
// =============================================================================

describe("poissonPMF", () => {
    it("returns correct value for λ=1.5, k=0 (≈ 0.2231)", () => {
        expect(poissonPMF(1.5, 0)).toBeCloseTo(0.2231, 3);
    });

    it("returns correct value for λ=1.5, k=1 (≈ 0.3347)", () => {
        expect(poissonPMF(1.5, 1)).toBeCloseTo(0.3347, 3);
    });

    it("returns correct value for λ=1.5, k=2 (≈ 0.2510)", () => {
        expect(poissonPMF(1.5, 2)).toBeCloseTo(0.2510, 3);
    });

    it("returns 0 for negative k", () => {
        expect(poissonPMF(1.5, -1)).toBe(0);
    });

    it("returns 0 for k beyond factorial table", () => {
        expect(poissonPMF(1.5, 11)).toBe(0);
    });

    it("all probabilities in a distribution sum to ≤ 1", () => {
        const sum = [0, 1, 2, 3, 4, 5].reduce((acc, k) => acc + poissonPMF(2.0, k), 0);
        expect(sum).toBeLessThanOrEqual(1.0);
        expect(sum).toBeGreaterThan(0.95); // most mass within 0–5
    });
});

// =============================================================================
// POISSON DISTRIBUTION
// =============================================================================

describe("poissonDistribution", () => {
    it("returns an array of length MAX_GOALS + 1 (7 entries)", () => {
        const dist = poissonDistribution(1.5);
        expect(dist).toHaveLength(7); // 0..6
    });

    it("values are all non-negative", () => {
        poissonDistribution(2.0).forEach(p => expect(p).toBeGreaterThanOrEqual(0));
    });

    it("values sum close to 1 for λ=1.0", () => {
        const sum = poissonDistribution(1.0).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 1);
    });
});

// =============================================================================
// FATIGUE ADJUSTMENT
// =============================================================================

describe("applyFatigueAdjustment", () => {
    it("returns lambda unchanged when rested ≥ 5 days", () => {
        expect(applyFatigueAdjustment(1.5, 7)).toBe(1.5);
        expect(applyFatigueAdjustment(1.5, 5)).toBe(1.5);
    });

    it("applies 3% penalty for 3–4 days rest", () => {
        expect(applyFatigueAdjustment(1.0, 4)).toBeCloseTo(0.97, 5);
        expect(applyFatigueAdjustment(1.0, 3)).toBeCloseTo(0.97, 5);
    });

    it("applies 6% penalty for 2 days rest", () => {
        expect(applyFatigueAdjustment(1.0, 2)).toBeCloseTo(0.94, 5);
    });

    it("applies 10% penalty for 0–1 days rest (back-to-back)", () => {
        expect(applyFatigueAdjustment(1.0, 1)).toBeCloseTo(0.90, 5);
        expect(applyFatigueAdjustment(1.0, 0)).toBeCloseTo(0.90, 5);
    });

    it("defaults to no penalty when daysRest is undefined", () => {
        expect(applyFatigueAdjustment(2.0)).toBe(2.0);
    });
});

// =============================================================================
// INJURY WEIGHT
// =============================================================================

describe("applyInjuryWeight", () => {
    it("returns lambda unchanged at full strength (1.0)", () => {
        expect(applyInjuryWeight(1.5, 1.0)).toBe(1.5);
    });

    it("reduces lambda at 0.9 injury factor", () => {
        expect(applyInjuryWeight(1.0, 0.9)).toBeCloseTo(0.9, 5);
    });

    it("clamps minimum injury factor at 0.80", () => {
        expect(applyInjuryWeight(1.0, 0.5)).toBeCloseTo(0.80, 5);
        expect(applyInjuryWeight(1.0, 0.0)).toBeCloseTo(0.80, 5);
    });

    it("clamps maximum injury factor at 1.0", () => {
        expect(applyInjuryWeight(1.0, 1.5)).toBeCloseTo(1.0, 5);
    });

    it("defaults to 1.0 (no effect) when undefined", () => {
        expect(applyInjuryWeight(2.0)).toBe(2.0);
    });
});

// =============================================================================
// SCORE MATRIX
// =============================================================================

describe("buildScoreMatrix", () => {
    const matrix = buildScoreMatrix(1.5, 1.1);

    it("returns a 7×7 matrix", () => {
        expect(matrix.matrix).toHaveLength(7);
        matrix.matrix.forEach(row => expect(row).toHaveLength(7));
    });

    it("all matrix cells are non-negative", () => {
        matrix.matrix.forEach(row =>
            row.forEach(cell => expect(cell).toBeGreaterThanOrEqual(0))
        );
    });

    it("all matrix probabilities sum close to 1", () => {
        const total = matrix.matrix.flat().reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(1.0, 1);
    });

    it("preserves lambda values", () => {
        expect(matrix.lambdaHome).toBe(1.5);
        expect(matrix.lambdaAway).toBe(1.1);
    });
});

// =============================================================================
// MARKET PROBABILITIES
// =============================================================================

describe("deriveMarketProbabilities", () => {
    const matrix = buildScoreMatrix(1.5, 1.1);
    const probs = deriveMarketProbabilities(matrix);

    it("result wins + draw + away win ≈ 1.0", () => {
        // Score matrix covers goals 0–6; the remainder (7+) is ~0.001, so precision is 1 dp
        expect(probs.home_win + probs.draw + probs.away_win).toBeCloseTo(1.0, 1);
    });

    it("over_2_5 + under_2_5 ≈ 1.0", () => {
        expect(probs.over_2_5 + probs.under_2_5).toBeCloseTo(1.0, 3);
    });

    it("btts_yes + btts_no ≈ 1.0", () => {
        expect(probs.btts_yes + probs.btts_no).toBeCloseTo(1.0, 3);
    });

    it("home_win probability is higher when lambdaHome > lambdaAway", () => {
        const m2 = buildScoreMatrix(2.5, 0.8);
        const p2 = deriveMarketProbabilities(m2);
        expect(p2.home_win).toBeGreaterThan(p2.away_win);
    });

    it("away_win probability is higher when lambdaAway > lambdaHome", () => {
        const m2 = buildScoreMatrix(0.8, 2.5);
        const p2 = deriveMarketProbabilities(m2);
        expect(p2.away_win).toBeGreaterThan(p2.home_win);
    });

    it("all returned probabilities are between 0 and 1", () => {
        for (const [key, val] of Object.entries(probs)) {
            if (typeof val === "number") {
                expect(val, key).toBeGreaterThanOrEqual(0);
                expect(val, key).toBeLessThanOrEqual(1);
            }
        }
    });
});

// =============================================================================
// LEAGUE HOME ADVANTAGE
// =============================================================================

describe("getLeagueHomeAdvantage", () => {
    it("returns configured value for Premier League (id=8)", () => {
        expect(getLeagueHomeAdvantage(8)).toBeGreaterThan(1.0);
    });

    it("returns configured value for UCL (id=2)", () => {
        expect(getLeagueHomeAdvantage(2)).toBeGreaterThan(1.0);
    });

    it("returns fallback for an unconfigured league id", () => {
        const fallback = getLeagueHomeAdvantage(99999);
        expect(fallback).toBeGreaterThan(1.0); // home advantage always > 1
    });
});

// =============================================================================
// KELLY CRITERION
// =============================================================================

describe("computeKellyStake", () => {
    it("returns 0 stake for negative Kelly (no edge)", () => {
        // p=0.4, odds=2.0 → edge = 0, Kelly = 0
        const result = computeKellyStake(0.4, 2.0);
        expect(result.suggestedStake).toBe(0);
        expect(result.fullKelly).toBe(0);
    });

    it("returns a positive stake when there is edge", () => {
        // p=0.6, odds=2.0 → positive edge
        const result = computeKellyStake(0.6, 2.0);
        expect(result.suggestedStake).toBeGreaterThan(0);
        expect(result.fullKelly).toBeGreaterThan(0);
        expect(result.fractionalKelly).toBeLessThan(result.fullKelly);
    });

    it("caps stake at MAX_SINGLE_STAKE (5%)", () => {
        // Extreme edge: p=0.95, odds=3.0
        const result = computeKellyStake(0.95, 3.0);
        expect(result.suggestedStake).toBeLessThanOrEqual(0.05);
    });

    it("returns 0 stake for invalid inputs", () => {
        expect(computeKellyStake(0, 2.0).suggestedStake).toBe(0);
        expect(computeKellyStake(1, 2.0).suggestedStake).toBe(0);
        expect(computeKellyStake(0.5, 1.0).suggestedStake).toBe(0);
        expect(computeKellyStake(0.5, 0.5).suggestedStake).toBe(0);
    });

    it("fractionalKelly = fullKelly × 0.25 (quarter Kelly)", () => {
        const result = computeKellyStake(0.6, 2.0);
        if (result.fullKelly > 0) {
            expect(result.fractionalKelly).toBeCloseTo(result.fullKelly * 0.25, 4);
        }
    });
});

// =============================================================================
// EDGE SCORE
// =============================================================================

describe("computeEdgeScore", () => {
    const mockRisk = {
        isApproved: true,
        varianceAdjustedEV: 0.08,
        volatilityScore: 25,
        liquidityScore: 75,
        warnings: [],
    };

    // Build a real CLVProjection using the predictCLV function
    const mockCLV: CLVProjection = predictCLV(2.0, 0.60, 0.08, 8);

    it("returns a score between 0 and 100", () => {
        const result = computeEdgeScore(0.08, 0.06, mockCLV, mockRisk, 75, 0.60, 2.0);
        expect(result.edgeScore).toBeGreaterThanOrEqual(0);
        expect(result.edgeScore).toBeLessThanOrEqual(100);
    });

    it("higher EV produces higher edge score", () => {
        const low  = computeEdgeScore(0.04, 0.04, mockCLV, mockRisk, 70, 0.55, 2.0);
        const high = computeEdgeScore(0.15, 0.12, mockCLV, mockRisk, 70, 0.65, 2.0);
        expect(high.edgeScore).toBeGreaterThan(low.edgeScore);
    });

    it("assigns a risk tier (A+, A, or B)", () => {
        const result = computeEdgeScore(0.10, 0.08, mockCLV, mockRisk, 80, 0.62, 2.1);
        expect(["A+", "A", "B"]).toContain(result.riskTier);
    });

    it("returns suggestedStake as a number between 0 and 0.05", () => {
        const result = computeEdgeScore(0.08, 0.06, mockCLV, mockRisk, 75, 0.60, 2.0);
        expect(result.suggestedStake).toBeGreaterThanOrEqual(0);
        expect(result.suggestedStake).toBeLessThanOrEqual(0.05);
    });
});

// =============================================================================
// CLV PROJECTION
// =============================================================================

describe("predictCLV", () => {
    it("returns all required CLVProjection fields", () => {
        const result = predictCLV(2.1, 0.55, 0.07, 8);
        expect(typeof result.clvPercent).toBe("number");
        expect(typeof result.predictedClosingOdds).toBe("number");
        expect(typeof result.clvScore).toBe("number");
        expect(typeof result.fairOdds).toBe("number");
        expect(["shortening", "drifting", "stable"]).toContain(result.lineDirection);
    });

    it("positive edge leads to positive CLV projection", () => {
        const result = predictCLV(2.1, 0.58, 0.10, 10);
        expect(result.clvPercent).toBeGreaterThan(0);
    });

    it("higher bookmaker count yields higher CLV score (more liquidity = stronger signal)", () => {
        const low  = predictCLV(2.1, 0.55, 0.07, 2);
        const high = predictCLV(2.1, 0.55, 0.07, 15);
        expect(high.clvScore).toBeGreaterThanOrEqual(low.clvScore);
    });

    it("large edge produces shortening line direction", () => {
        const result = predictCLV(2.5, 0.50, 0.15, 10);
        expect(result.lineDirection).toBe("shortening");
    });

    it("small edge produces stable or drifting line direction", () => {
        const result = predictCLV(2.0, 0.50, 0.01, 5);
        expect(["stable", "drifting"]).toContain(result.lineDirection);
    });

    it("fairOdds ≈ 1 / modelProbability", () => {
        const result = predictCLV(2.0, 0.50, 0.05, 8);
        expect(result.fairOdds).toBeCloseTo(1 / 0.50, 1);
    });

    it("clvScore is between 0 and 100", () => {
        const result = predictCLV(2.0, 0.55, 0.08, 6);
        expect(result.clvScore).toBeGreaterThanOrEqual(0);
        expect(result.clvScore).toBeLessThanOrEqual(100);
    });
});

// =============================================================================
// CORRELATION DETECTION
// =============================================================================

// ─── Minimal EvaluatedMarket stub for correlation tests ───────────────────────
function mkMarket(marketId: string, isResultMarket = false) {
    // Only marketId and isResultMarket are used by areCorrelated
    return { marketId, isResultMarket } as import("../markets").EvaluatedMarket;
}

describe("areCorrelated", () => {
    it("detects correlated markets (same result family)", () => {
        // Both isResultMarket=true → correlated
        expect(areCorrelated(mkMarket("result_home", true), mkMarket("dnb_home", true))).toBe(true);
    });

    it("detects correlated over/under markets", () => {
        expect(areCorrelated(mkMarket("over_2_5"), mkMarket("over_1_5"))).toBe(true);
    });

    it("detects correlated btts markets", () => {
        expect(areCorrelated(mkMarket("btts_yes"), mkMarket("btts_no"))).toBe(true);
    });

    it("returns false for uncorrelated markets (result vs btts)", () => {
        // isResultMarket=true but btts is not a result market
        expect(areCorrelated(mkMarket("result_home", true), mkMarket("btts_yes", false))).toBe(false);
    });

    it("returns false for uncorrelated markets (over vs result)", () => {
        expect(areCorrelated(mkMarket("over_2_5", false), mkMarket("result_draw", true))).toBe(false);
    });

    it("is commutative (a,b) === (b,a)", () => {
        const a = mkMarket("result_home", true);
        const b = mkMarket("dnb_home", true);
        expect(areCorrelated(a, b)).toBe(areCorrelated(b, a));
    });
});
