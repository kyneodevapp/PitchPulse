/**
 * PitchPulse Edge Engine — Configuration Constants
 * 
 * Institutional-grade thresholds for the unified Edge Engine.
 * Single-tier system with composite Edge Score ranking.
 * No magic numbers anywhere in the engine.
 */

// ============ EDGE ENGINE THRESHOLDS ============

export const ENGINE_CONFIG = {
    ODDS_MIN: 1.40,                   // Evaluate markets down to 1.40 (display floor is separate)
    ODDS_MAX: 10.20,
    ODDS_DISPLAY_MIN: 1.80,           // Hard UI floor — never display below this
    MIN_EDGE_PCT: 0.02,               // 2% minimum edge over implied probability
    MIN_EV_THRESHOLD: 0.02,           // +2% minimum expected value
    MIN_CONFIDENCE: 45,               // Minimum confidence score (0-100)
    MAX_PICKS_PER_DAY: 20,            // Cap total daily output
} as const;

// ============ MONTE CARLO ============

export const MONTE_CARLO_CONFIG = {
    ITERATIONS: 10_000,
    SEED_BASE: 42,                // Deterministic seeding for reproducibility
    CI_LEVEL: 0.95,               // 95% confidence intervals
    MAX_CI_WIDTH: 0.25,           // Reject if CI width exceeds this
} as const;

// ============ EDGE SCORE WEIGHTS ============
// Composite: Edge Score = Σ(weight_i × normalized_component_i)

export const EDGE_SCORE_WEIGHTS = {
    EV: 0.30,                     // Expected Value contribution
    EDGE_PCT: 0.25,               // Raw edge % contribution
    CLV: 0.20,                    // Closing Line Value projection
    VOLATILITY: 0.15,             // Stability (inverted volatility)
    LIQUIDITY: 0.10,              // Market liquidity score
} as const;

// ============ RISK TIERS ============

export const RISK_TIERS = {
    A_PLUS: { min: 85, label: 'A+', color: 'emerald' },
    A: { min: 70, label: 'A', color: 'amber' },
    B: { min: 55, label: 'B', color: 'slate' },
    REJECT: { min: 0, label: 'REJECT', color: 'red' },
} as const;

export type RiskTierLabel = 'A+' | 'A' | 'B';

export function getRiskTier(edgeScore: number): RiskTierLabel | 'REJECT' {
    if (edgeScore >= RISK_TIERS.A_PLUS.min) return 'A+';
    if (edgeScore >= RISK_TIERS.A.min) return 'A';
    if (edgeScore >= RISK_TIERS.B.min) return 'B';
    return 'REJECT';
}

// ============ KELLY / BANKROLL ============

export const KELLY_CONFIG = {
    FRACTION: 0.25,               // Quarter Kelly
    MAX_SINGLE_STAKE: 0.05,       // 5% max per bet
    MAX_DAILY_EXPOSURE: 0.10,     // 10% max daily exposure
    MAX_DRAWDOWN_HALT: 0.15,      // Stop if drawdown > 15%
} as const;

// ============ RESULT & CORRECT SCORE GATES ============

export const RESULT_THRESHOLDS = {
    MIN_PROBABILITY: 0.40,        // P ≥ 40%
    MIN_EDGE: 0.03,               // Edge ≥ 3%
    MIN_EV: 0.03,                 // EV ≥ 3%
} as const;

export const CORRECT_SCORE_THRESHOLDS = {
    MIN_PROBABILITY: 0.18,
    MIN_EDGE: 0.08,
    MIN_CONFIDENCE: 75,
    MIN_EV: 0.12,
} as const;

// ============ POISSON MODEL ============

export const POISSON_CONFIG = {
    MAX_GOALS: 6,                 // Score matrix dimension (0..6 = 7×7)
    HOME_ADVANTAGE: 1.08,
    HOME_ADVANTAGE_MIN: 1.05,
    HOME_ADVANTAGE_MAX: 1.12,
    HALF_TIME_FACTOR: 0.45,       // λ_half ≈ λ_full × 0.45
} as const;

// ============ PER-LEAGUE HOME ADVANTAGE ============

export const LEAGUE_HOME_ADVANTAGES: Record<number, number> = {
    2: 1.10,    // Champions League
    5: 1.08,    // Europa League  
    8: 1.09,    // Premier League
    9: 1.12,    // La Liga
    564: 1.11,  // Serie A
    567: 1.08,  // Bundesliga
    82: 1.10,   // Ligue 1
    384: 1.09,  // Championship
    387: 1.08,  // Eredivisie
};

// ============ VARIANCE MULTIPLIERS ============

export const VARIANCE_MULTIPLIERS: Record<string, number> = {
    // Goal Totals
    'over_2.5': 0.95,
    'over_3.5': 0.90,
    'under_1.5': 1.00,
    'under_2.5': 1.00,
    // Draw No Bet
    'draw_no_bet': 0.93,
    'draw_no_bet_away': 0.93,
    // BTTS + Result
    'btts_home_win': 0.88,
    'btts_away_win': 0.88,
    // BTTS
    'btts': 0.93,
    'btts_no': 0.93,
    // BTTS + Goals
    'btts_over_2.5': 0.90,
    'btts_over_3.5': 0.88,
    'btts_under_1.5': 0.88,
    'btts_under_2.5': 0.90,
    // 1st Half
    '1h_over_1.5': 0.92,
    '1h_over_2.5': 0.88,
    '1h_under_0.5': 0.95,
    '1h_under_1.5': 0.95,
    // High-odds variance penalties (odds > 4.00)
    'high_odds_4_6': 0.85,
    'high_odds_6_8': 0.80,
    'high_odds_8_plus': 0.75,
} as const;

/** Get variance multiplier with high-odds penalty */
export function getVarianceMultiplier(marketId: string, odds: number): number {
    const base = VARIANCE_MULTIPLIERS[marketId.replace(/\./g, '_')] ?? 0.95;
    if (odds >= 8.0) return base * 0.80;
    if (odds >= 6.0) return base * 0.85;
    if (odds >= 4.0) return base * 0.90;
    return base;
}

// ============ PROBABILITY CALIBRATION ============
// Corrects known Poisson model biases per market type.
// Poisson underestimates high-scoring outcomes → boost Over/BTTS
// Poisson overestimates low-scoring outcomes → shrink Under
export const PROBABILITY_CALIBRATION: Record<string, number> = {
    // Over markets — Poisson underestimates, boost
    'over_2.5': 1.15,
    'over_3.5': 1.22,
    // Under markets — Poisson overestimates, shrink
    'under_1.5': 0.82,
    'under_2.5': 0.88,
    // BTTS — typically underestimated, boost
    'btts': 1.15,
    'btts_no': 0.88,
    // BTTS combos
    'btts_over_2.5': 1.18,
    'btts_over_3.5': 1.22,
    'btts_under_1.5': 0.80,
    'btts_under_2.5': 0.85,
    // BTTS + Result
    'btts_home_win': 1.15,
    'btts_away_win': 1.15,
    // DNB — reduce to prevent dominance
    'draw_no_bet': 0.92,
    'draw_no_bet_away': 0.92,
    // 1st Half
    '1h_over_1.5': 1.12,
    '1h_over_2.5': 1.15,
    '1h_under_0.5': 0.85,
    '1h_under_1.5': 0.88,
};

/** Get calibration factor for a market. Returns 1.0 if none defined. */
export function getCalibrationFactor(marketId: string): number {
    return PROBABILITY_CALIBRATION[marketId] ?? 1.0;
}

// ============ CONFIDENCE MODEL WEIGHTS ============

export const CONFIDENCE_WEIGHTS = {
    ATTACK_STABILITY: 0.20,
    DEFENSIVE_CONSISTENCY: 0.20,
    MARKET_STABILITY: 0.15,
    FORM_RELIABILITY: 0.20,
    ELO_STRENGTH: 0.15,
    INJURY_STABILITY: 0.10,
} as const;

// ============ SPORTMONKS MARKET IDS ============

export const SPORTMONKS_MARKETS = {
    MATCH_WINNER: 1,
    BTTS: 14,
    OVER_UNDER: [80, 81, 105],
    BTTS_GOALS: 82,
    RESULT_BTTS: 97,
    FIRST_HALF_OU: [28, 107],
    DRAW_NO_BET: 10,
} as const;

export const UK_BOOKMAKER_IDS = [2, 5, 6, 9, 12, 13, 19] as const;
export const UK_BOOKMAKER_NAMES: Record<number, string> = {
    2: "bet365",
    5: "888Sport",
    6: "BetFred",
    9: "Betfair",
    12: "BetVictor",
    13: "Coral",
    19: "Paddy Power",
};

/** Minimum bookmakers required for liquidity approval */
export const MIN_BOOKMAKER_COUNT = 2;

// ============ LEAGUE IDS ============

export const SUPPORTED_LEAGUE_IDS = [2, 5, 8, 9, 564, 567, 82, 384, 387] as const;
