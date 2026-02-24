/**
 * PitchPulse Edge Engine — Volatility & Risk Assessment Module
 * 
 * Evaluates risk profile of each bet opportunity:
 *   - Variance-adjusted EV
 *   - Tail-risk detection (dangerous distribution shapes)
 *   - Liquidity scoring (bookmaker availability)
 *   - High-odds volatility control
 *   - Confidence interval stability checks
 */

import { getRiskTier, MONTE_CARLO_CONFIG, ENGINE_CONFIG, type RiskTierLabel } from './config';

// ============ TYPES ============

export interface RiskAssessment {
    varianceAdjustedEV: number;
    volatilityScore: number;         // 0-100 (lower = more stable)
    tailRiskFlag: boolean;           // true if dangerous distribution
    liquidityScore: number;          // 0-100 (higher = more liquid)
    riskTier: RiskTierLabel | 'REJECT';
    rejectionReason?: string;
    isApproved: boolean;
}

// ============ RISK ASSESSMENT ============

/**
 * Full risk assessment for a bet opportunity.
 * 
 * @param ev               - Raw expected value
 * @param odds             - Best available odds
 * @param confidenceInterval - [lower, upper] from Monte Carlo
 * @param simulationVolatility - Volatility score from MC (0-100)
 * @param bookmakerCount   - Number of bookmakers offering this market
 * @param varianceMultiplier - Market-specific variance multiplier
 */
export function assessRisk(
    ev: number,
    odds: number,
    confidenceInterval: [number, number],
    simulationVolatility: number,
    bookmakerCount: number,
    varianceMultiplier: number,
): RiskAssessment {
    // 1. Variance-adjusted EV
    // Higher volatility → more EV penalty
    const volatilityPenalty = 1 - (simulationVolatility / 200); // 0.5-1.0
    const varianceAdjustedEV = ev * volatilityPenalty * varianceMultiplier;

    // 2. Confidence interval width check
    const ciWidth = confidenceInterval[1] - confidenceInterval[0];

    // 3. Liquidity score based on bookmaker availability
    const liquidityScore = Math.min(100, Math.round((bookmakerCount / 7) * 100));

    // 4. Tail-risk detection
    // Flag if: wide CI + high odds + high volatility
    const tailRiskFlag = (
        ciWidth > 0.20 &&
        odds >= 3.50 &&
        simulationVolatility >= 50
    );

    // ============ REJECTION GATES ============

    // Gate 1: CI too wide — unstable probability estimate
    if (ciWidth > MONTE_CARLO_CONFIG.MAX_CI_WIDTH) {
        return {
            varianceAdjustedEV,
            volatilityScore: simulationVolatility,
            tailRiskFlag: true,
            liquidityScore,
            riskTier: 'REJECT',
            rejectionReason: `CI width ${(ciWidth * 100).toFixed(1)}% exceeds max ${(MONTE_CARLO_CONFIG.MAX_CI_WIDTH * 100)}%`,
            isApproved: false,
        };
    }

    // Gate 2: High odds + high volatility → too risky
    if (odds >= 4.00 && simulationVolatility >= 70) {
        return {
            varianceAdjustedEV,
            volatilityScore: simulationVolatility,
            tailRiskFlag: true,
            liquidityScore,
            riskTier: 'REJECT',
            rejectionReason: `High-odds volatility: odds ${odds.toFixed(2)} with volatility ${simulationVolatility}/100`,
            isApproved: false,
        };
    }

    // Gate 3: Low liquidity — not enough bookmakers (relaxed: at least 1 needed)
    if (bookmakerCount < 1) {
        return {
            varianceAdjustedEV,
            volatilityScore: simulationVolatility,
            tailRiskFlag: false,
            liquidityScore,
            riskTier: 'REJECT',
            rejectionReason: `Low liquidity: only ${bookmakerCount} bookmaker(s)`,
            isApproved: false,
        };
    }

    // Gate 4: Variance-adjusted EV below minimum
    if (varianceAdjustedEV < ENGINE_CONFIG.MIN_EV_THRESHOLD * 0.8) {
        return {
            varianceAdjustedEV,
            volatilityScore: simulationVolatility,
            tailRiskFlag,
            liquidityScore,
            riskTier: 'REJECT',
            rejectionReason: `Variance-adjusted EV ${(varianceAdjustedEV * 100).toFixed(1)}% below threshold`,
            isApproved: false,
        };
    }

    // ============ APPROVED — Compute risk tier ============

    // Composite risk score for tier assignment
    // Weight: stability (60%), liquidity (20%), EV strength (20%)
    const stabilityComponent = Math.max(0, 100 - simulationVolatility);
    const evComponent = Math.min(100, varianceAdjustedEV * 500); // 0.20 EV → 100
    const riskScore = stabilityComponent * 0.6 + liquidityScore * 0.2 + evComponent * 0.2;
    const riskTier = getRiskTier(riskScore);

    if (riskTier === 'REJECT') {
        return {
            varianceAdjustedEV,
            volatilityScore: simulationVolatility,
            tailRiskFlag,
            liquidityScore,
            riskTier: 'REJECT',
            rejectionReason: `Risk score ${riskScore.toFixed(0)} below minimum tier threshold`,
            isApproved: false,
        };
    }

    return {
        varianceAdjustedEV,
        volatilityScore: simulationVolatility,
        tailRiskFlag,
        liquidityScore,
        riskTier,
        isApproved: true,
    };
}
