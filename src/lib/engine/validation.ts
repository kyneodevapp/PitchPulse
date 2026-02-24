/**
 * PitchPulse Edge Engine — Validation Layer
 * 
 * Anti-mistake validation. SHA256 checksums. Correlation detection.
 * Every prediction must pass through this gate before publication.
 * 
 * Updated for unified Edge Engine — single tier, Edge Score validation.
 */

import {
    ENGINE_CONFIG,
    RESULT_THRESHOLDS, CORRECT_SCORE_THRESHOLDS,
} from './config';
import type { EvaluatedMarket } from './markets';

// ============ SHA256 CHECKSUM ============

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

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    if (typeof globalThis.crypto?.subtle !== 'undefined') {
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const { createHash } = await import('crypto');
    return createHash('sha256').update(payload).digest('hex');
}

export async function verifyChecksum(
    storedChecksum: string,
    fields: Parameters<typeof generateChecksum>[0]
): Promise<boolean> {
    const computed = await generateChecksum(fields);
    return computed === storedChecksum;
}

// ============ EDGE ENGINE VALIDATION ============

export interface ValidationResult {
    passed: boolean;
    reason?: string;
}

/**
 * Final validation before rendering / publication.
 * Every check from the Edge Engine specification.
 */
export function validateBeforePublish(market: EvaluatedMarket): ValidationResult {
    // 1. Market in whitelist?
    if (!market.marketId || !market.label) {
        return { passed: false, reason: 'Market not in whitelist' };
    }

    // 2. Odds within unified range?
    if (market.odds < ENGINE_CONFIG.ODDS_MIN || market.odds > ENGINE_CONFIG.ODDS_MAX) {
        return { passed: false, reason: `Odds ${market.odds} outside range [${ENGINE_CONFIG.ODDS_MIN}, ${ENGINE_CONFIG.ODDS_MAX}]` };
    }

    // 3. Edge ≥ minimum?
    if (market.edge < ENGINE_CONFIG.MIN_EDGE_PCT) {
        return { passed: false, reason: `Edge ${(market.edge * 100).toFixed(1)}% below minimum ${(ENGINE_CONFIG.MIN_EDGE_PCT * 100)}%` };
    }

    // 4. EV ≥ minimum? (+4%)
    if (market.ev < ENGINE_CONFIG.MIN_EV_THRESHOLD) {
        return { passed: false, reason: `EV ${(market.ev * 100).toFixed(1)}% below minimum ${(ENGINE_CONFIG.MIN_EV_THRESHOLD * 100)}%` };
    }

    // 5. Confidence ≥ minimum?
    if (market.confidence < ENGINE_CONFIG.MIN_CONFIDENCE) {
        return { passed: false, reason: `Confidence ${market.confidence} below minimum ${ENGINE_CONFIG.MIN_CONFIDENCE}` };
    }

    // 6. Edge Score ≥ minimum (40)?
    if (market.edgeScore < 40) {
        return { passed: false, reason: `Edge Score ${market.edgeScore} below minimum (40)` };
    }

    // 7. Risk assessment must not be REJECT
    if (market.riskAssessment && !market.riskAssessment.isApproved) {
        return { passed: false, reason: `Risk rejected: ${market.riskAssessment.rejectionReason}` };
    }

    // 8. Result market gates
    if (market.isResultMarket) {
        if (market.probability < RESULT_THRESHOLDS.MIN_PROBABILITY) {
            return { passed: false, reason: `Result probability ${(market.probability * 100).toFixed(1)}% below ${(RESULT_THRESHOLDS.MIN_PROBABILITY * 100)}%` };
        }
        if (market.edge < RESULT_THRESHOLDS.MIN_EDGE) {
            return { passed: false, reason: `Result edge below ${(RESULT_THRESHOLDS.MIN_EDGE * 100)}%` };
        }
        if (market.ev < RESULT_THRESHOLDS.MIN_EV) {
            return { passed: false, reason: `Result EV below ${(RESULT_THRESHOLDS.MIN_EV * 100)}%` };
        }
    }

    // 9. Correct score gates
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
        if (market.ev < CORRECT_SCORE_THRESHOLDS.MIN_EV) {
            return { passed: false, reason: 'Correct score EV too low' };
        }
    }

    // 10. High-variance market needs higher EV
    if (market.varianceMultiplier < 0.90 && market.evAdjusted < 0.12) {
        return { passed: false, reason: 'High-variance market requires EV_adj ≥ 0.12' };
    }

    // 11. CI stability check
    if (market.confidenceInterval) {
        const ciWidth = market.confidenceInterval[1] - market.confidenceInterval[0];
        if (ciWidth > 0.25) {
            return { passed: false, reason: `CI width ${(ciWidth * 100).toFixed(1)}% exceeds 25% stability threshold` };
        }
    }

    return { passed: true };
}

// ============ CORRELATION DETECTION ============

export function areCorrelated(a: EvaluatedMarket, b: EvaluatedMarket): boolean {
    const aGoal = a.marketId.startsWith('over_') || a.marketId.startsWith('under_');
    const bGoal = b.marketId.startsWith('over_') || b.marketId.startsWith('under_');
    if (aGoal && bGoal) return true;

    if (a.marketId.startsWith('btts') && b.marketId.startsWith('btts')) return true;
    if (a.isResultMarket && b.isResultMarket) return true;

    return false;
}
