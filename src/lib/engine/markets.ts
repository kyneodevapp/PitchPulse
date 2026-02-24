/**
 * PitchPulse Edge Engine — Market Whitelist & Evaluation
 * 
 * Defines ALL allowed markets, their odds-mapping to SportMonks,
 * and the EV computation pipeline.
 * 
 * REMOVED: Double Chance, Team Home Under 3.5, Team Away Under 3.5
 * UNIFIED: Single tier — no more elite/safe split
 */

import {
    ENGINE_CONFIG,
    RESULT_THRESHOLDS, CORRECT_SCORE_THRESHOLDS,
    SPORTMONKS_MARKETS,
    getVarianceMultiplier,
} from './config';
import type { MarketProbabilities } from './poisson';
import type { CLVProjection } from './clv';
import type { RiskAssessment } from './risk';
import type { RiskTierLabel } from './config';

// ============ MARKET DEFINITION ============

export interface MarketDefinition {
    id: string;
    label: string;
    probKey: keyof MarketProbabilities | null;
    sportmonksMarketIds: readonly number[];
    sportmonksLabel?: string;
    sportmonksName?: string;
    isTeamSpecific?: boolean;
    teamSide?: 'home' | 'away';
}

/**
 * Master whitelist. Only these markets are ever evaluated.
 * REMOVED: home_under_3.5, away_under_3.5, dc_home_draw, dc_away_draw
 */
export const MARKET_WHITELIST: MarketDefinition[] = [
    // ===== Goal Totals =====
    {
        id: 'over_2.5', label: 'Over 2.5 Goals',
        probKey: 'over_2_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '2.5',
    },
    {
        id: 'over_3.5', label: 'Over 3.5 Goals',
        probKey: 'over_3_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '3.5',
    },
    {
        id: 'under_1.5', label: 'Under 1.5 Goals',
        probKey: 'under_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '1.5',
    },
    {
        id: 'under_2.5', label: 'Under 2.5 Goals',
        probKey: 'under_2_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '2.5',
    },

    // ===== Draw No Bet =====
    {
        id: 'draw_no_bet', label: '{home} (DNB)',
        probKey: 'home_win',  // Use raw win prob — normalized dnb_home inflates edge
        sportmonksMarketIds: [SPORTMONKS_MARKETS.DRAW_NO_BET],
        sportmonksLabel: '1',
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'draw_no_bet_away', label: '{away} (DNB)',
        probKey: 'away_win',  // Use raw win prob — normalized dnb_away inflates edge
        sportmonksMarketIds: [SPORTMONKS_MARKETS.DRAW_NO_BET],
        sportmonksLabel: '2',
        isTeamSpecific: true, teamSide: 'away',
    },

    // ===== BTTS + Result =====
    {
        id: 'btts_home_win', label: '{home} & BTTS',
        probKey: 'btts_home_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.RESULT_BTTS],
        sportmonksLabel: 'Home',
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'btts_away_win', label: '{away} & BTTS',
        probKey: 'btts_away_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.RESULT_BTTS],
        sportmonksLabel: 'Away',
        isTeamSpecific: true, teamSide: 'away',
    },

    // ===== BTTS =====
    {
        id: 'btts', label: 'Both Teams To Score',
        probKey: 'btts_yes',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS],
        sportmonksLabel: 'Yes',
    },
    {
        id: 'btts_no', label: 'BTTS: No',
        probKey: 'btts_no',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS],
        sportmonksLabel: 'No',
    },

    // ===== Combined BTTS + Goals =====
    {
        id: 'btts_over_2.5', label: 'BTTS & Over 2.5',
        probKey: 'btts_over_2_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Over 2.5 & Yes',
    },
    {
        id: 'btts_over_3.5', label: 'BTTS & Over 3.5',
        probKey: 'btts_over_3_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Over 3.5 & Yes',
    },
    {
        id: 'btts_under_1.5', label: 'BTTS & Under 1.5',
        probKey: 'btts_under_1_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Under 1.5 & Yes',
    },
    {
        id: 'btts_under_2.5', label: 'BTTS & Under 2.5',
        probKey: 'btts_under_2_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Under 2.5 & Yes',
    },

    // ===== 1st Half Goals =====
    {
        id: '1h_over_1.5', label: '1st Half Over 1.5',
        probKey: 'first_half_over_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.FIRST_HALF_OU,
        sportmonksLabel: 'Over', sportmonksName: '1.5',
    },
    {
        id: '1h_over_2.5', label: '1st Half Over 2.5',
        probKey: 'first_half_over_2_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.FIRST_HALF_OU,
        sportmonksLabel: 'Over', sportmonksName: '2.5',
    },
    {
        id: '1h_under_0.5', label: '1st Half Under 0.5',
        probKey: 'first_half_under_0_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.FIRST_HALF_OU,
        sportmonksLabel: 'Under', sportmonksName: '0.5',
    },
    {
        id: '1h_under_1.5', label: '1st Half Under 1.5',
        probKey: 'first_half_under_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.FIRST_HALF_OU,
        sportmonksLabel: 'Under', sportmonksName: '1.5',
    },
];

// ============ EVALUATED MARKET (Step 9 Output) ============

export interface EvaluatedMarket {
    marketId: string;
    label: string;
    probability: number;           // P_model (0-1)
    impliedProbability: number;    // 1 / odds
    edge: number;                  // P_model - P_implied
    odds: number;                  // Best available odds
    bet365Odds: number | null;
    bestBookmaker: string;
    ev: number;                    // Raw EV = (P_model × odds) - 1
    evAdjusted: number;            // Variance-adjusted EV
    varianceMultiplier: number;
    confidence: number;
    score: number;                 // Legacy compatibility
    isResultMarket: boolean;
    isCorrectScore: boolean;
    correctScoreline?: string;
    // Edge Engine additions
    edgeScore: number;
    riskTier: RiskTierLabel;
    suggestedStake: number;
    clvProjection: CLVProjection | null;
    riskAssessment: RiskAssessment | null;
    simulationWinFreq: number;
    confidenceInterval: [number, number];
    bookmakerCount: number;
}

// ============ EV COMPUTATION (Step 9) ============

/**
 * Evaluate a single market against real odds.
 * Returns null if the market should be rejected at basic level.
 */
export function evaluateMarket(
    market: MarketDefinition,
    probability: number,
    odds: number,
    bet365Odds: number | null,
    bestBookmaker: string,
    confidence: number,
    homeTeam: string,
    awayTeam: string,
    bookmakerCount: number = 3,
    correctScoreline?: string,
): EvaluatedMarket | null {
    if (odds <= 0 || probability <= 0) return null;

    // Only reject truly out-of-range odds
    if (odds > ENGINE_CONFIG.ODDS_MAX) return null;

    const impliedProbability = 1 / odds;
    const edge = probability - impliedProbability;
    const ev = (probability * odds) - 1;

    // NO rejection of negative edge/EV — we score ALL markets and pick the best

    // Variance multiplier with high-odds penalty
    const varianceMultiplier = getVarianceMultiplier(market.id, odds);

    // Confidence weight
    const confidenceWeight = confidence / 100;

    // EV_adjusted = EV × C × Variance_multiplier
    const evAdjusted = ev * confidenceWeight * varianceMultiplier;

    // Substitute team names in label
    let label = market.label
        .replace('{home}', homeTeam)
        .replace('{away}', awayTeam);

    // Final ranking score
    const score = evAdjusted * confidence;

    return {
        marketId: market.id,
        label,
        probability,
        impliedProbability,
        edge,
        odds,
        bet365Odds,
        bestBookmaker,
        ev,
        evAdjusted,
        varianceMultiplier,
        confidence,
        score,
        isResultMarket: market.id.startsWith('draw_no_bet'),
        isCorrectScore: false,
        // Defaults — filled in by the main engine pipeline
        edgeScore: 0,
        riskTier: 'B',
        suggestedStake: 0,
        clvProjection: null,
        riskAssessment: null,
        simulationWinFreq: 0,
        confidenceInterval: [0, 0],
        bookmakerCount,
    };
}

// Hard filters removed — engine now scores ALL markets and picks highest-scoring
// with odds >= ODDS_DISPLAY_MIN as the only hard gate at selection time.

/**
 * Get the display label for a market with team names substituted.
 */
export function resolveMarketLabel(market: MarketDefinition, homeTeam: string, awayTeam: string): string {
    return market.label
        .replace('{home}', homeTeam)
        .replace('{away}', awayTeam);
}
