/**
 * PitchPulse Edge Engine — Configuration Constants
 * 
 * Institutional-grade thresholds for the unified Edge Engine.
 * Single-tier system with composite Edge Score ranking.
 * No magic numbers anywhere in the engine.
 */

// ============ EDGE ENGINE THRESHOLDS ============

export const ENGINE_CONFIG = {
    ODDS_MIN: 1.50,                   // Evaluate markets down to 1.50 (internal floor for candidate selection)
    ODDS_MAX: 10.20,
    ODDS_DISPLAY_MIN: 1.60,           // Hard UI floor — NEVER display below 1.60
    MIN_EDGE_PCT: 0.05,               // 5% minimum edge over implied probability (raised from 2%)
    MIN_EV_THRESHOLD: 0.02,           // +2% minimum expected value
    MIN_CONFIDENCE: 55,               // Minimum confidence score (raised from 45)
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
    // European
    2: 1.10,    // Champions League
    5: 1.08,    // Europa League
    2286: 1.07, // Europa Conference League
    // England
    8: 1.09,    // Premier League
    9: 1.07,    // Championship
    24: 1.06,   // FA Cup (neutral venues common)
    27: 1.06,   // Carabao Cup (neutral venues common)
    // Spain
    564: 1.12,  // La Liga
    567: 1.10,  // La Liga 2
    570: 1.06,  // Copa Del Rey
    // Germany
    82: 1.10,   // Bundesliga
    // Italy
    384: 1.11,  // Serie A
    387: 1.09,  // Serie B
    390: 1.06,  // Coppa Italia
    // France
    301: 1.08,  // Ligue 1
    // Netherlands
    72: 1.09,   // Eredivisie
    // Portugal
    462: 1.10,  // Liga Portugal
    // Scotland
    501: 1.12,  // Scottish Premiership (strong home advantage)
    // Turkey
    600: 1.14,  // Süper Lig (strong home advantage)
    // Belgium
    208: 1.09,  // Belgian Pro League
    // Austria
    181: 1.09,  // Admiral Bundesliga
    // Denmark
    271: 1.08,  // Superliga
    // Greece
    591: 1.11,  // Super League
};

// ============ DEFENSIVE LEAGUES ============
// These leagues have lower goal averages — BTTS calibration boost is reduced for them

export const DEFENSIVE_LEAGUE_IDS = new Set([
    301,   // Ligue 1 (avg ~2.4 goals)
    384,   // Serie A (avg ~2.5 goals)
    387,   // Serie B
    208,   // Belgian Pro League
    501,   // Scottish Premiership
    567,   // La Liga 2
    271,   // Danish Superliga
]);

// ============ HIGH-SCORING LEAGUES ============
// BTTS full 1.15 calibration boost applies to these leagues

export const HIGH_SCORING_LEAGUE_IDS = new Set([
    8,     // Premier League (avg ~2.8 goals)
    82,    // Bundesliga (avg ~3.0 goals)
    72,    // Eredivisie (avg ~3.1 goals)
    564,   // La Liga
    600,   // Süper Lig
]);

// ============ VARIANCE MULTIPLIERS ============

export const VARIANCE_MULTIPLIERS: Record<string, number> = {
    // Goal Totals
    'over_2.5': 0.95,
    'over_3.5': 0.90,
    'under_1.5': 1.00,
    'under_2.5': 1.00,
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
// NOTE: BTTS calibration is league-aware — see getBTTSCalibrationFactor()
export const PROBABILITY_CALIBRATION: Record<string, number> = {
    // Over markets — Poisson underestimates, boost
    'over_2.5': 1.15,
    'over_3.5': 1.22,
    // Under markets — Poisson overestimates, shrink
    'under_1.5': 0.82,
    'under_2.5': 0.88,
    // BTTS — base value, overridden per league by getBTTSCalibrationFactor
    'btts': 1.15,
    'btts_no': 0.88,
    // BTTS combos — base values
    'btts_over_2.5': 1.18,
    'btts_over_3.5': 1.22,
    'btts_under_1.5': 0.80,
    'btts_under_2.5': 0.85,
    // BTTS + Result
    'btts_home_win': 1.15,
    'btts_away_win': 1.15,
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

/**
 * Get league-aware BTTS calibration factor.
 * High scoring leagues: full 1.15 boost.
 * Defensive leagues: reduced 1.05 boost (avoids over-prediction).
 * Neutral leagues: standard 1.10 boost.
 */
export function getBTTSCalibrationFactor(leagueId: number): number {
    if (HIGH_SCORING_LEAGUE_IDS.has(leagueId)) return 1.15;
    if (DEFENSIVE_LEAGUE_IDS.has(leagueId)) return 1.05;
    return 1.10; // Neutral default
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

export const SUPPORTED_LEAGUE_IDS = [
    2, 5, 2286,           // European
    8, 9, 24, 27,         // England
    564, 567, 570,        // Spain
    82,                   // Germany
    384, 387, 390,        // Italy
    301,                  // France
    72,                   // Netherlands
    462,                  // Portugal
    501,                  // Scotland
    600,                  // Turkey
    208,                  // Belgium
    181,                  // Austria
    271,                  // Denmark
    591,                  // Greece
] as const;
