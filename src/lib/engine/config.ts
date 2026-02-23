/**
 * PitchPulse Master Engine — Configuration Constants
 * 
 * All thresholds, multipliers, and limits in one place.
 * No magic numbers anywhere in the engine.
 */

// ============ TIER DEFINITIONS ============

export const ELITE_CONFIG = {
    ODDS_MIN: 1.70,
    ODDS_MAX: 2.50,
    MIN_EDGE: 0.05,           // 5% minimum edge over implied probability
    MIN_EV_ADJUSTED: 0.08,    // Minimum adjusted expected value
    MIN_CONFIDENCE: 65,       // Minimum confidence score (0-100)
    MAX_PICKS: 6,             // Maximum picks on dashboard
    MIN_PICKS: 3,             // Minimum before showing "No Edge" state
} as const;

export const SAFE_CONFIG = {
    ODDS_MIN: 1.20,
    ODDS_MAX: 1.50,
    MIN_EDGE: 0.03,           // 3% minimum edge
    MIN_EV_ADJUSTED: 0.03,    // Lower EV threshold for safe bets
    MIN_CONFIDENCE: 70,       // Higher confidence required for safe picks
} as const;

// ============ RESULT & CORRECT SCORE GATES ============

/** Result markets (1X2) require stricter thresholds */
export const RESULT_THRESHOLDS = {
    MIN_PROBABILITY: 0.60,    // P ≥ 60%
    MIN_EDGE: 0.07,           // Edge ≥ 7%
    MIN_EV_ADJUSTED: 0.10,    // EV_adj ≥ 0.10
} as const;

/** Correct Score markets are rare — extremely high bar */
export const CORRECT_SCORE_THRESHOLDS = {
    MIN_PROBABILITY: 0.18,    // P ≥ 18%
    MIN_EDGE: 0.08,           // Edge ≥ 8%
    MIN_CONFIDENCE: 80,       // Confidence ≥ 80%
    MIN_EV_ADJUSTED: 0.12,    // EV_adj ≥ 0.12
} as const;

// ============ POISSON MODEL ============

export const POISSON_CONFIG = {
    MAX_GOALS: 6,             // Score matrix dimension (0..6 = 7x7)
    HOME_ADVANTAGE: 1.08,     // Default home advantage multiplier
    HOME_ADVANTAGE_MIN: 1.05, // Lower bound for home advantage
    HOME_ADVANTAGE_MAX: 1.12, // Upper bound for home advantage
    HALF_TIME_FACTOR: 0.45,   // λ_half ≈ λ_full × 0.45
} as const;

// ============ VARIANCE MULTIPLIERS ============
// Applied to raw EV to account for market-specific variance

export const VARIANCE_MULTIPLIERS: Record<string, number> = {
    'over_2.5': 0.95,
    'under_2.5': 1.00,
    'over_3.5': 0.90,
    'under_3.5': 1.00,
    'over_1.5': 0.97,
    'btts': 0.93,
    'btts_over_2.5': 0.90,
    'btts_under_2.5': 0.90,
    'btts_home_win': 0.88,
    'btts_away_win': 0.88,
    'home_over_1.5': 0.94,
    'away_over_1.5': 0.94,
    'home_under_3.5': 0.97,
    'away_under_3.5': 0.97,
    'result': 0.92,
    'result_home': 0.92,
    'result_draw': 0.92,
    'result_away': 0.92,
    'draw_no_bet': 0.93,
    'correct_score': 0.75,
    'double_chance': 0.98,
    '1h_over_0.5': 0.95,
    'btts_no': 0.93,
    'under_4.5': 0.98,
} as const;

// ============ CONFIDENCE MODEL WEIGHTS ============
// Step 11: 5-factor weighted confidence

export const CONFIDENCE_WEIGHTS = {
    ATTACK_STABILITY: 0.25,
    DEFENSIVE_CONSISTENCY: 0.25,
    MARKET_STABILITY: 0.20,
    FORM_RELIABILITY: 0.20,
    INJURY_STABILITY: 0.10, // Placeholder — no injury data from API
} as const;

// ============ SPORTMONKS MARKET IDS ============

export const SPORTMONKS_MARKETS = {
    MATCH_WINNER: 1,          // 1X2
    DOUBLE_CHANCE: 12,        // Home/Draw, Away/Draw, Home/Away
    BTTS: 14,                 // Both Teams to Score
    OVER_UNDER: [80, 81, 105],// Goals Over/Under (various provider IDs)
    BTTS_GOALS: 82,           // Total Goals / BTTS combined
    RESULT_BTTS: 97,          // Result / BTTS combined
    FIRST_HALF_OU: [28, 107], // 1st Half Over/Under
    DRAW_NO_BET: 10,          // Draw No Bet
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

// ============ LEAGUE IDS ============

export const SUPPORTED_LEAGUE_IDS = [2, 5, 8, 9, 564, 567, 82, 384, 387] as const;
