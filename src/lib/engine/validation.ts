/**
 * PitchPulse Master Engine — Validation Layer (Step 14)
 * 
 * Anti-mistake validation. SHA256 checksums. Correlation detection.
 * Every prediction must pass through this gate before publication.
 */

import {
    ELITE_CONFIG, SAFE_CONFIG,
    RESULT_THRESHOLDS, CORRECT_SCORE_THRESHOLDS,
} from './config';
import type { EvaluatedMarket } from './markets';

// ============ SHA256 CHECKSUM ============

/**
 * Generate SHA256 checksum of prediction fields.
 * Used for immutable history integrity verification.
 */
export async function generateChecksum(fields: {
    fixtureId: number;
    lambdaHome: number;
    lambdaAway: number;
    market: string;
    pModel: number;
    odds: number;
    evAdjusted: number;
    confidence: number;
    publishedAt: string;
}): Promise<string> {
    const payload = [
        fields.fixtureId,
        fields.lambdaHome.toFixed(4),
        fields.lambdaAway.toFixed(4),
        fields.market,
        fields.pModel.toFixed(4),
        fields.odds.toFixed(3),
        fields.evAdjusted.toFixed(4),
        fields.confidence,
        fields.publishedAt,
    ].join('|');

    // Use Web Crypto API (available in Node.js 18+ and all modern browsers)
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    // Node.js environment
    if (typeof globalThis.crypto?.subtle !== 'undefined') {
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: use Node.js crypto module
    const { createHash } = await import('crypto');
    return createHash('sha256').update(payload).digest('hex');
}

/**
 * Verify a checksum matches the stored prediction fields.
 */
export async function verifyChecksum(
    storedChecksum: string,
    fields: Parameters<typeof generateChecksum>[0]
): Promise<boolean> {
    const computed = await generateChecksum(fields);
    return computed === storedChecksum;
}

// ============ ANTI-MISTAKE VALIDATION (Step 14) ============

export interface ValidationResult {
    passed: boolean;
    reason?: string;
}

/**
 * Final validation before rendering on Dashboard.
 * Every check from Step 14 of the Master Prompt.
 */
export function validateBeforePublish(market: EvaluatedMarket): ValidationResult {
    const config = market.tier === 'elite' ? ELITE_CONFIG : SAFE_CONFIG;

    // 1. Market in whitelist? (Already guaranteed by MARKET_WHITELIST, but double-check)
    if (!market.marketId || !market.label) {
        return { passed: false, reason: 'Market not in whitelist' };
    }

    // 2. Odds within range?
    if (market.odds < config.ODDS_MIN || market.odds > config.ODDS_MAX) {
        return { passed: false, reason: `Odds ${market.odds} outside range [${config.ODDS_MIN}, ${config.ODDS_MAX}]` };
    }

    // 3. Edge ≥ minimum?
    if (market.edge < config.MIN_EDGE) {
        return { passed: false, reason: `Edge ${(market.edge * 100).toFixed(1)}% below minimum ${(config.MIN_EDGE * 100).toFixed(1)}%` };
    }

    // 4. EV_adjusted ≥ minimum?
    if (market.evAdjusted < config.MIN_EV_ADJUSTED) {
        return { passed: false, reason: `EV_adj ${market.evAdjusted.toFixed(3)} below minimum ${config.MIN_EV_ADJUSTED}` };
    }

    // 5. Confidence ≥ minimum?
    if (market.confidence < config.MIN_CONFIDENCE) {
        return { passed: false, reason: `Confidence ${market.confidence} below minimum ${config.MIN_CONFIDENCE}` };
    }

    // 6. Result market gates
    if (market.isResultMarket) {
        if (market.probability < RESULT_THRESHOLDS.MIN_PROBABILITY) {
            return { passed: false, reason: `Result probability ${(market.probability * 100).toFixed(1)}% below ${(RESULT_THRESHOLDS.MIN_PROBABILITY * 100)}%` };
        }
        if (market.edge < RESULT_THRESHOLDS.MIN_EDGE) {
            return { passed: false, reason: `Result edge ${(market.edge * 100).toFixed(1)}% below ${(RESULT_THRESHOLDS.MIN_EDGE * 100)}%` };
        }
        if (market.evAdjusted < RESULT_THRESHOLDS.MIN_EV_ADJUSTED) {
            return { passed: false, reason: `Result EV_adj ${market.evAdjusted.toFixed(3)} below ${RESULT_THRESHOLDS.MIN_EV_ADJUSTED}` };
        }
    }

    // 7. Correct score gates
    if (market.isCorrectScore) {
        if (market.probability < CORRECT_SCORE_THRESHOLDS.MIN_PROBABILITY) {
            return { passed: false, reason: 'Correct score probability too low' };
        }
        if (market.edge < CORRECT_SCORE_THRESHOLDS.MIN_EDGE) {
            return { passed: false, reason: 'Correct score edge too low' };
        }
        if (market.confidence < CORRECT_SCORE_THRESHOLDS.MIN_CONFIDENCE) {
            return { passed: false, reason: 'Correct score confidence too low' };
        }
        if (market.evAdjusted < CORRECT_SCORE_THRESHOLDS.MIN_EV_ADJUSTED) {
            return { passed: false, reason: 'Correct score EV_adj too low' };
        }
    }

    // 8. Extreme variance check: high-variance markets need higher EV
    if (market.varianceMultiplier < 0.90 && market.evAdjusted < 0.12) {
        return { passed: false, reason: 'High-variance market requires EV_adj ≥ 0.12' };
    }

    return { passed: true };
}

// ============ CORRELATION DETECTION ============

/**
 * Detect if two picks are highly correlated (same match or overlapping outcomes).
 * Used in Step 12 to prevent multiple correlated picks on Dashboard.
 */
export function areCorrelated(a: EvaluatedMarket, b: EvaluatedMarket): boolean {
    // Same market type = correlated (can't pick Over 2.5 AND Over 3.5 from same match)
    const aGoal = a.marketId.startsWith('over_') || a.marketId.startsWith('under_');
    const bGoal = b.marketId.startsWith('over_') || b.marketId.startsWith('under_');
    if (aGoal && bGoal) return true;

    // BTTS and BTTS combo = correlated
    if (a.marketId.startsWith('btts') && b.marketId.startsWith('btts')) return true;

    // Result and DNB = correlated
    if (a.isResultMarket && b.isResultMarket) return true;

    return false;
}
