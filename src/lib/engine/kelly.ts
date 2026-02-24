/**
 * PitchPulse Edge Engine — Kelly Staking & Bankroll Management
 * 
 * Institutional-grade position sizing:
 *   - Fractional Kelly Criterion
 *   - Daily exposure caps
 *   - Maximum drawdown halts
 *   - Per-bet stake limits
 */

import { KELLY_CONFIG } from './config';

// ============ TYPES ============

export interface StakingSuggestion {
    fullKelly: number;               // Full Kelly % of bankroll
    fractionalKelly: number;         // Quarter Kelly (recommended)
    suggestedStake: number;          // Final stake after all caps
    reasoning: string;               // Human-readable explanation
}

export interface ExposureCheck {
    approved: boolean;
    currentExposure: number;         // Current day's total exposure
    proposedExposure: number;        // After adding this bet
    maxExposure: number;             // Daily limit
    reason?: string;
}

export interface DrawdownCheck {
    approved: boolean;
    currentDrawdown: number;
    maxDrawdown: number;
    reason?: string;
}

// ============ KELLY STAKING ============

/**
 * Compute Kelly Criterion stake for a single bet.
 * 
 * Full Kelly: f* = (p × b - q) / b
 *   where p = win probability, q = 1-p, b = odds - 1
 * 
 * We use quarter Kelly (0.25f*) for institutional risk management.
 */
export function computeKellyStake(
    probability: number,
    odds: number,
    fraction: number = KELLY_CONFIG.FRACTION,
): StakingSuggestion {
    if (odds <= 1 || probability <= 0 || probability >= 1) {
        return {
            fullKelly: 0,
            fractionalKelly: 0,
            suggestedStake: 0,
            reasoning: 'Invalid inputs — no stake',
        };
    }

    const b = odds - 1; // Net odds
    const q = 1 - probability;
    const fullKelly = (probability * b - q) / b;

    if (fullKelly <= 0) {
        return {
            fullKelly: 0,
            fractionalKelly: 0,
            suggestedStake: 0,
            reasoning: 'Negative Kelly — no edge detected',
        };
    }

    const fractionalKelly = fullKelly * fraction;
    const suggestedStake = Math.min(fractionalKelly, KELLY_CONFIG.MAX_SINGLE_STAKE);

    let reasoning: string;
    if (suggestedStake === KELLY_CONFIG.MAX_SINGLE_STAKE) {
        reasoning = `Capped at ${(KELLY_CONFIG.MAX_SINGLE_STAKE * 100).toFixed(1)}% max single stake (Kelly suggested ${(fractionalKelly * 100).toFixed(1)}%)`;
    } else {
        reasoning = `${(fraction * 100)}% Kelly: ${(fullKelly * 100).toFixed(1)}% full → ${(suggestedStake * 100).toFixed(1)}% recommended`;
    }

    return {
        fullKelly: Math.round(fullKelly * 10000) / 10000,
        fractionalKelly: Math.round(fractionalKelly * 10000) / 10000,
        suggestedStake: Math.round(suggestedStake * 10000) / 10000,
        reasoning,
    };
}

// ============ DAILY EXPOSURE ============

/**
 * Check if adding a new stake would exceed daily exposure limit.
 */
export function checkDailyExposure(
    existingStakes: number[],
    newStake: number,
): ExposureCheck {
    const currentExposure = existingStakes.reduce((sum, s) => sum + s, 0);
    const proposedExposure = currentExposure + newStake;
    const maxExposure = KELLY_CONFIG.MAX_DAILY_EXPOSURE;

    if (proposedExposure > maxExposure) {
        return {
            approved: false,
            currentExposure,
            proposedExposure,
            maxExposure,
            reason: `Would exceed daily exposure: ${(proposedExposure * 100).toFixed(1)}% > ${(maxExposure * 100)}% limit`,
        };
    }

    return {
        approved: true,
        currentExposure,
        proposedExposure,
        maxExposure,
    };
}

// ============ DRAWDOWN CONTROL ============

/**
 * Check if current drawdown has exceeded halt threshold.
 */
export function checkDrawdown(
    currentBankroll: number,
    peakBankroll: number,
): DrawdownCheck {
    if (peakBankroll <= 0) {
        return { approved: true, currentDrawdown: 0, maxDrawdown: KELLY_CONFIG.MAX_DRAWDOWN_HALT };
    }

    const currentDrawdown = (peakBankroll - currentBankroll) / peakBankroll;
    const maxDrawdown = KELLY_CONFIG.MAX_DRAWDOWN_HALT;

    if (currentDrawdown >= maxDrawdown) {
        return {
            approved: false,
            currentDrawdown,
            maxDrawdown,
            reason: `Drawdown ${(currentDrawdown * 100).toFixed(1)}% exceeds halt threshold ${(maxDrawdown * 100)}%`,
        };
    }

    return {
        approved: true,
        currentDrawdown,
        maxDrawdown,
    };
}
