/**
 * PitchPulse Master Engine — Market Whitelist & Evaluation
 * 
 * Defines ALL allowed markets, their odds-mapping to SportMonks,
 * and the EV computation pipeline (Step 9).
 */

import {
    ELITE_CONFIG, SAFE_CONFIG,
    RESULT_THRESHOLDS, CORRECT_SCORE_THRESHOLDS,
    VARIANCE_MULTIPLIERS,
    SPORTMONKS_MARKETS,
} from './config';
import type { MarketProbabilities } from './poisson';

// ============ MARKET DEFINITION ============

export type MarketTier = 'elite' | 'safe' | 'both';

export interface MarketDefinition {
    id: string;                         // Internal key (matches VARIANCE_MULTIPLIERS keys)
    label: string;                      // Display name
    tier: MarketTier;                   // Which tier(s) this market can appear in
    probKey: keyof MarketProbabilities  // Key in MarketProbabilities to read
    | null;                         // null = needs special handling
    sportmonksMarketIds: readonly number[];      // SportMonks market IDs for odds lookup
    sportmonksLabel?: string;           // Label filter for odds (e.g. "Over", "Home")
    sportmonksName?: string;            // Name filter (e.g. "2.5" for Over/Under threshold)
    isTeamSpecific?: boolean;           // true = needs team name substitution
    teamSide?: 'home' | 'away';        // Which team this refers to
}

/**
 * Master whitelist. Only these markets are ever evaluated.
 * Order matters — first match wins for duplicate outcome types.
 */
export const MARKET_WHITELIST: MarketDefinition[] = [
    // ===== ELITE + SAFE: Goal Totals =====
    {
        id: 'over_2.5', label: 'Over 2.5 Goals', tier: 'elite',
        probKey: 'over_2_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '2.5',
    },
    {
        id: 'under_2.5', label: 'Under 2.5 Goals', tier: 'elite',
        probKey: 'under_2_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '2.5',
    },
    {
        id: 'over_3.5', label: 'Over 3.5 Goals', tier: 'elite',
        probKey: 'over_3_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '3.5',
    },
    {
        id: 'under_3.5', label: 'Under 3.5 Goals', tier: 'elite',
        probKey: 'under_3_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '3.5',
    },

    // ===== ELITE: BTTS =====
    {
        id: 'btts', label: 'Both Teams To Score', tier: 'elite',
        probKey: 'btts_yes',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS],
        sportmonksLabel: 'Yes',
    },

    // ===== ELITE: Combined BTTS + Goals =====
    {
        id: 'btts_over_2.5', label: 'BTTS & Over 2.5', tier: 'elite',
        probKey: 'btts_over_2_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Over 2.5 & Yes',
    },
    {
        id: 'btts_under_2.5', label: 'BTTS & Under 2.5', tier: 'elite',
        probKey: 'btts_under_2_5',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS_GOALS],
        sportmonksLabel: 'Under 2.5 & Yes',
    },

    // ===== ELITE: BTTS + Result =====
    {
        id: 'btts_home_win', label: '{home} & BTTS', tier: 'elite',
        probKey: 'btts_home_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.RESULT_BTTS],
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'btts_away_win', label: '{away} & BTTS', tier: 'elite',
        probKey: 'btts_away_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.RESULT_BTTS],
        isTeamSpecific: true, teamSide: 'away',
    },

    // ===== ELITE: Team Totals =====
    {
        id: 'home_over_1.5', label: '{home} Over 1.5', tier: 'elite',
        probKey: 'home_over_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '1.5',
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'away_over_1.5', label: '{away} Over 1.5', tier: 'elite',
        probKey: 'away_over_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '1.5',
        isTeamSpecific: true, teamSide: 'away',
    },
    {
        id: 'home_under_3.5', label: '{home} Under 3.5', tier: 'elite',
        probKey: 'home_under_3_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '3.5',
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'away_under_3.5', label: '{away} Under 3.5', tier: 'elite',
        probKey: 'away_under_3_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '3.5',
        isTeamSpecific: true, teamSide: 'away',
    },

    // ===== ELITE: Draw No Bet =====
    {
        id: 'draw_no_bet', label: '{home} (DNB)', tier: 'elite',
        probKey: 'dnb_home',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.DRAW_NO_BET],
        isTeamSpecific: true, teamSide: 'home',
    },

    // ===== ELITE: Result (1X2) — Strictly controlled =====
    {
        id: 'result_home', label: '{home} to Win', tier: 'elite',
        probKey: 'home_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.MATCH_WINNER],
        sportmonksLabel: 'Home',
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'result_draw', label: 'Draw', tier: 'elite',
        probKey: 'draw',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.MATCH_WINNER],
        sportmonksLabel: 'Draw',
    },
    {
        id: 'result_away', label: '{away} to Win', tier: 'elite',
        probKey: 'away_win',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.MATCH_WINNER],
        sportmonksLabel: 'Away',
        isTeamSpecific: true, teamSide: 'away',
    },

    // ===== ELITE (RARE): Correct Score =====
    {
        id: 'correct_score', label: 'Correct Score', tier: 'elite',
        probKey: null,  // Uses correct_scores array from MarketProbabilities
        sportmonksMarketIds: [93],
    },

    // ===== SAFE: High-probability, low-odds markets =====
    {
        id: 'over_1.5', label: 'Over 1.5 Goals', tier: 'safe',
        probKey: 'over_1_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Over', sportmonksName: '1.5',
    },
    {
        id: 'under_4.5', label: 'Under 4.5 Goals', tier: 'safe',
        probKey: 'under_4_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.OVER_UNDER,
        sportmonksLabel: 'Under', sportmonksName: '4.5',
    },
    {
        id: 'dc_home_draw', label: '{home} or Draw', tier: 'safe',
        probKey: 'dc_home_draw',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.DOUBLE_CHANCE],
        isTeamSpecific: true, teamSide: 'home',
    },
    {
        id: 'dc_away_draw', label: '{away} or Draw', tier: 'safe',
        probKey: 'dc_away_draw',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.DOUBLE_CHANCE],
        isTeamSpecific: true, teamSide: 'away',
    },
    {
        id: '1h_over_0.5', label: '1st Half Over 0.5', tier: 'safe',
        probKey: 'first_half_over_0_5',
        sportmonksMarketIds: SPORTMONKS_MARKETS.FIRST_HALF_OU,
        sportmonksLabel: 'Over', sportmonksName: '0.5',
    },
    {
        id: 'btts_no', label: 'BTTS: No', tier: 'safe',
        probKey: 'btts_no',
        sportmonksMarketIds: [SPORTMONKS_MARKETS.BTTS],
        sportmonksLabel: 'No',
    },
];

// ============ EVALUATED MARKET (Step 9 Output) ============

export interface EvaluatedMarket {
    marketId: string;           // Internal key
    label: string;              // Display label (team names substituted)
    tier: MarketTier;
    probability: number;        // P_model (0-1)
    impliedProbability: number; // 1 / odds
    edge: number;               // P_model - P_implied
    odds: number;               // Best available odds
    bet365Odds: number | null;  // bet365 specific odds
    bestBookmaker: string;      // Name of bookmaker with best odds
    ev: number;                 // Raw EV = (P_model × odds) - 1
    evAdjusted: number;         // EV × confidence_weight × variance_multiplier
    varianceMultiplier: number;
    confidence: number;         // Confidence score (0-100)
    score: number;              // Final ranking score = EV_adjusted × confidence
    isResultMarket: boolean;
    isCorrectScore: boolean;
    correctScoreline?: string;  // e.g. "2-1" for correct score markets
}

// ============ EV COMPUTATION (Step 9) ============

/**
 * Evaluate a single market against real odds.
 * Returns null if the market should be rejected.
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
    correctScoreline?: string,
): EvaluatedMarket | null {
    if (odds <= 0 || probability <= 0) return null;

    const impliedProbability = 1 / odds;
    const edge = probability - impliedProbability;
    const ev = (probability * odds) - 1;

    // Variance multiplier lookup (use a normalized key)
    const varKey = market.id.replace(/\./g, '_');
    const varianceMultiplier = VARIANCE_MULTIPLIERS[varKey] ?? 0.95;

    // Confidence weight
    const confidenceWeight = confidence / 100;

    // EV_adjusted = EV × C × Variance_multiplier
    const evAdjusted = ev * confidenceWeight * varianceMultiplier;

    // Substitute team names in label
    let label = market.label
        .replace('{home}', homeTeam)
        .replace('{away}', awayTeam);

    if (correctScoreline) {
        label = `Correct Score: ${correctScoreline}`;
    }

    const isResultMarket = market.id.startsWith('result_') || market.id === 'draw_no_bet';
    const isCorrectScore = market.id === 'correct_score';

    // Final ranking score
    const score = evAdjusted * confidence;

    return {
        marketId: market.id,
        label,
        tier: market.tier,
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
        isResultMarket,
        isCorrectScore,
        correctScoreline,
    };
}

// ============ HARD FILTERING (Step 10) ============

/**
 * Apply strict rejection rules. Returns the market if it passes, null if rejected.
 */
export function applyHardFilters(market: EvaluatedMarket): EvaluatedMarket | null {
    const config = market.tier === 'elite' ? ELITE_CONFIG : SAFE_CONFIG;

    // 1. Odds range
    if (market.odds < config.ODDS_MIN || market.odds > config.ODDS_MAX) return null;

    // 2. Edge minimum
    if (market.edge < config.MIN_EDGE) return null;

    // 3. EV adjusted minimum
    if (market.evAdjusted < config.MIN_EV_ADJUSTED) return null;

    // 4. Confidence minimum
    if (market.confidence < config.MIN_CONFIDENCE) return null;

    // 5. Result market gates (Step 10)
    if (market.isResultMarket) {
        if (market.probability < RESULT_THRESHOLDS.MIN_PROBABILITY) return null;
        if (market.edge < RESULT_THRESHOLDS.MIN_EDGE) return null;
        if (market.evAdjusted < RESULT_THRESHOLDS.MIN_EV_ADJUSTED) return null;
    }

    // 6. Correct score gates
    if (market.isCorrectScore) {
        if (market.probability < CORRECT_SCORE_THRESHOLDS.MIN_PROBABILITY) return null;
        if (market.edge < CORRECT_SCORE_THRESHOLDS.MIN_EDGE) return null;
        if (market.confidence < CORRECT_SCORE_THRESHOLDS.MIN_CONFIDENCE) return null;
        if (market.evAdjusted < CORRECT_SCORE_THRESHOLDS.MIN_EV_ADJUSTED) return null;
    }

    return market;
}

/**
 * Get the display label for a market with team names substituted.
 */
export function resolveMarketLabel(market: MarketDefinition, homeTeam: string, awayTeam: string): string {
    return market.label
        .replace('{home}', homeTeam)
        .replace('{away}', awayTeam);
}
