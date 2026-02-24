/**
 * PitchPulse Edge Engine — Portfolio Correlation & Impact Module
 * 
 * Prevents correlated bet clustering and assesses portfolio-level impact:
 *   - Correlation detection (same league, similar markets)
 *   - Worst-case drawdown projection
 *   - Diversification scoring
 */

import type { MatchPrediction } from './engine';

// ============ TYPES ============

export interface CorrelationResult {
    isCorrelated: boolean;
    correlationType?: 'same_match' | 'same_league_market' | 'overlapping_outcome';
    description?: string;
}

export interface PortfolioImpact {
    worstCaseDrawdown: number;       // If all open bets lose
    expectedReturn: number;          // Weighted expected P&L
    diversificationScore: number;    // 0-100 (higher = more diversified)
    approved: boolean;
    reason?: string;
}

// ============ CORRELATION DETECTION ============

/**
 * Check if two picks are correlated.
 * Correlated bets should not both appear in the same day's portfolio.
 */
export function checkCorrelation(
    pickA: MatchPrediction,
    pickB: MatchPrediction,
): CorrelationResult {
    // Same match — always correlated
    if (pickA.fixtureId === pickB.fixtureId) {
        return {
            isCorrelated: true,
            correlationType: 'same_match',
            description: 'Same match — only one bet per match allowed',
        };
    }

    // Same league + same market type → potential correlation
    if (pickA.leagueId === pickB.leagueId) {
        const aIsGoals = pickA.marketId.includes('over') || pickA.marketId.includes('under');
        const bIsGoals = pickB.marketId.includes('over') || pickB.marketId.includes('under');

        if (aIsGoals && bIsGoals) {
            return {
                isCorrelated: true,
                correlationType: 'same_league_market',
                description: `Same league (${pickA.leagueName}) with same market type — goal correlated`,
            };
        }
    }

    // Overlapping outcome types in the same match (already caught above, but defensive)
    if (pickA.fixtureId === pickB.fixtureId) {
        const aGoal = pickA.marketId.startsWith('over_') || pickA.marketId.startsWith('under_');
        const bGoal = pickB.marketId.startsWith('over_') || pickB.marketId.startsWith('under_');
        if (aGoal && bGoal) {
            return {
                isCorrelated: true,
                correlationType: 'overlapping_outcome',
                description: 'Overlapping goal markets on same match',
            };
        }
    }

    return { isCorrelated: false };
}

/**
 * Filter a list of picks to remove correlated bets.
 * Keeps the highest Edge Score pick when correlation is detected.
 */
export function deduplicateCorrelatedPicks(picks: MatchPrediction[]): MatchPrediction[] {
    // Sort by Edge Score descending
    const sorted = [...picks].sort((a, b) => b.edgeScore - a.edgeScore);
    const approved: MatchPrediction[] = [];

    for (const pick of sorted) {
        let hasCorrelation = false;
        for (const existing of approved) {
            const result = checkCorrelation(pick, existing);
            if (result.isCorrelated) {
                hasCorrelation = true;
                break;
            }
        }
        if (!hasCorrelation) {
            approved.push(pick);
        }
    }

    return approved;
}

// ============ PORTFOLIO IMPACT ============

/**
 * Assess the impact of current portfolio on bankroll.
 */
export function assessPortfolioImpact(
    currentPicks: MatchPrediction[],
    bankrollFraction: number = 1.0, // Normalize to 1.0 = full bankroll
): PortfolioImpact {
    if (currentPicks.length === 0) {
        return {
            worstCaseDrawdown: 0,
            expectedReturn: 0,
            diversificationScore: 100,
            approved: true,
        };
    }

    // Worst case: all bets lose
    const totalStake = currentPicks.reduce((sum, p) => sum + p.suggestedStake, 0);
    const worstCaseDrawdown = totalStake / bankrollFraction;

    // Expected return: Σ(stake × EV)
    const expectedReturn = currentPicks.reduce(
        (sum, p) => sum + p.suggestedStake * p.evAdjusted, 0
    );

    // Diversification: count unique leagues, unique market types
    const uniqueLeagues = new Set(currentPicks.map(p => p.leagueId)).size;
    const uniqueMarkets = new Set(currentPicks.map(p => {
        // Normalize market type
        if (p.marketId.includes('over') || p.marketId.includes('under')) return 'goals';
        if (p.marketId.includes('btts')) return 'btts';
        if (p.marketId.includes('result') || p.marketId.includes('draw')) return 'result';
        return p.marketId;
    })).size;

    const leagueDiversity = Math.min(50, (uniqueLeagues / Math.max(1, currentPicks.length)) * 100);
    const marketDiversity = Math.min(50, (uniqueMarkets / Math.max(1, currentPicks.length)) * 100);
    const diversificationScore = Math.round(leagueDiversity + marketDiversity);

    // Rejection: worst case drawdown > 15%
    if (worstCaseDrawdown > 0.15) {
        return {
            worstCaseDrawdown,
            expectedReturn,
            diversificationScore,
            approved: false,
            reason: `Worst-case drawdown ${(worstCaseDrawdown * 100).toFixed(1)}% exceeds 15% limit`,
        };
    }

    return {
        worstCaseDrawdown,
        expectedReturn,
        diversificationScore,
        approved: true,
    };
}
