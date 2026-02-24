/**
 * PitchPulse Edge Engine — Composite Edge Score Module
 * 
 * Combines all quantitative signals into a single ranking score:
 *   Edge Score = Σ(weight_i × normalized_component_i)
 * 
 * Components:
 *   1. EV (30%)      — Expected value magnitude
 *   2. Edge % (25%)  — Raw probability edge over market
 *   3. CLV (20%)     — Closing Line Value projection
 *   4. Volatility (15%) — Stability (inverted)
 *   5. Liquidity (10%)  — Market depth
 * 
 * Score range: 0–100. Only bets scoring ≥ 55 (B tier) are approved.
 */

import { EDGE_SCORE_WEIGHTS, getRiskTier, KELLY_CONFIG, type RiskTierLabel } from './config';
import type { CLVProjection } from './clv';
import type { RiskAssessment } from './risk';

// ============ TYPES ============

export interface EdgeScoreResult {
    edgeScore: number;                 // 0-100 composite
    components: {
        evComponent: number;           // Normalized EV contribution
        edgeComponent: number;         // Normalized Edge % contribution
        clvComponent: number;          // CLV score contribution
        volatilityComponent: number;   // Inverted volatility contribution
        liquidityComponent: number;    // Liquidity score contribution
    };
    riskTier: RiskTierLabel;
    suggestedStake: number;            // % of bankroll (Kelly-derived)
}

// ============ NORMALIZATION HELPERS ============

/** Normalize EV to 0-100 scale. EV of 0.20 (+20%) → 100 */
function normalizeEV(ev: number): number {
    return Math.min(100, Math.max(0, ev * 500));
}

/** Normalize Edge % to 0-100 scale. Edge of 0.15 (15%) → 100 */
function normalizeEdge(edge: number): number {
    return Math.min(100, Math.max(0, edge * 666));
}

/** Invert volatility: low volatility → high score */
function invertVolatility(volatilityScore: number): number {
    return Math.max(0, 100 - volatilityScore);
}

// ============ EDGE SCORE COMPUTATION ============

/**
 * Compute the composite Edge Score for a bet opportunity.
 * 
 * @param ev             - Variance-adjusted expected value
 * @param edge           - Raw edge % (model prob - implied prob)
 * @param clvProjection  - CLV forecasting result
 * @param riskAssessment - Risk assessment result
 * @param confidence     - Model confidence (0-100)
 * @param probability    - Model probability (0-1)
 * @param odds           - Best available odds
 */
export function computeEdgeScore(
    ev: number,
    edge: number,
    clvProjection: CLVProjection,
    riskAssessment: RiskAssessment,
    confidence: number,
    probability: number,
    odds: number,
): EdgeScoreResult {
    const w = EDGE_SCORE_WEIGHTS;

    // Normalize all components to 0-100
    const evNorm = normalizeEV(ev);
    const edgeNorm = normalizeEdge(edge);
    const clvNorm = clvProjection.clvScore;
    const volNorm = invertVolatility(riskAssessment.volatilityScore);
    const liqNorm = riskAssessment.liquidityScore;

    // Weighted composite
    const rawScore =
        w.EV * evNorm +
        w.EDGE_PCT * edgeNorm +
        w.CLV * clvNorm +
        w.VOLATILITY * volNorm +
        w.LIQUIDITY * liqNorm;

    // Apply confidence damper: lower confidence slightly reduces score
    const confidenceFactor = 0.7 + (confidence / 100) * 0.3; // 0.70–1.00
    const edgeScore = Math.min(100, Math.max(0, Math.round(rawScore * confidenceFactor)));

    // Risk tier from score
    const riskTier = getRiskTier(edgeScore);
    if (riskTier === 'REJECT') {
        // Should not happen if called after risk assessment,
        // but guard against it
        return {
            edgeScore,
            components: {
                evComponent: evNorm,
                edgeComponent: edgeNorm,
                clvComponent: clvNorm,
                volatilityComponent: volNorm,
                liquidityComponent: liqNorm,
            },
            riskTier: 'B', // Floor at B if somehow borderline
            suggestedStake: 0,
        };
    }

    // Kelly-derived suggested stake
    const suggestedStake = fractionalKelly(probability, odds);

    return {
        edgeScore,
        components: {
            evComponent: evNorm,
            edgeComponent: edgeNorm,
            clvComponent: clvNorm,
            volatilityComponent: volNorm,
            liquidityComponent: liqNorm,
        },
        riskTier,
        suggestedStake,
    };
}

// ============ KELLY STAKING ============

/**
 * Fractional Kelly Criterion stake sizing.
 * 
 * Formula:
 *   Full Kelly = (p × odds - 1) / (odds - 1)
 *   Fractional = Full Kelly × KELLY_FRACTION
 *   Capped at MAX_SINGLE_STAKE
 * 
 * @param probability - Model probability of the outcome
 * @param odds        - Decimal odds
 * @returns Suggested stake as fraction of bankroll (0-1)
 */
function fractionalKelly(probability: number, odds: number): number {
    if (odds <= 1 || probability <= 0) return 0;

    const fullKelly = (probability * odds - 1) / (odds - 1);
    if (fullKelly <= 0) return 0;

    const fractional = fullKelly * KELLY_CONFIG.FRACTION;

    // Cap at max single stake
    const capped = Math.min(fractional, KELLY_CONFIG.MAX_SINGLE_STAKE);

    // Round to 1 decimal place as percentage
    return Math.round(capped * 1000) / 1000;
}
