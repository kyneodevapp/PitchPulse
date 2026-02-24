/**
 * PitchPulse Edge Engine — Poisson Mathematics
 * 
 * Pure mathematical module. No side effects, no API calls.
 * All market probabilities are derived from the 7×7 score matrix.
 * 
 * Enhanced with:
 *   - Per-league home advantage recalibration
 *   - Schedule fatigue adjustments
 *   - Injury/squad strength weighting
 */

import { POISSON_CONFIG, LEAGUE_HOME_ADVANTAGES } from './config';

const { MAX_GOALS, HALF_TIME_FACTOR } = POISSON_CONFIG;

// ============ CORE POISSON ============

/** Factorial lookup table (0! through 10!) */
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];

/** Poisson PMF: P(X = k) = (e^-λ × λ^k) / k! */
export function poissonPMF(lambda: number, k: number): number {
    if (k < 0 || k >= FACTORIALS.length) return 0;
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / FACTORIALS[k];
}

/** Compute full Poisson distribution for k = 0..MAX_GOALS */
export function poissonDistribution(lambda: number): number[] {
    const dist: number[] = [];
    for (let k = 0; k <= MAX_GOALS; k++) {
        dist.push(poissonPMF(lambda, k));
    }
    return dist;
}

// ============ ADJUSTMENTS ============

/**
 * Apply fatigue adjustment to λ based on days since last match.
 * Teams with < 3 days rest get a λ penalty.
 * 
 * @param lambda   - Base lambda
 * @param daysRest - Days since last match (default: 7 = fully rested)
 * @returns Adjusted lambda
 */
export function applyFatigueAdjustment(lambda: number, daysRest: number = 7): number {
    if (daysRest >= 5) return lambda; // Fully rested
    if (daysRest >= 3) return lambda * 0.97; // Slight fatigue
    if (daysRest >= 2) return lambda * 0.94; // Moderate fatigue
    return lambda * 0.90; // Heavy fatigue (back-to-back)
}

/**
 * Apply injury/squad strength weighting.
 * Placeholder: defaults to 1.0 (no adjustment) unless data is provided.
 * 
 * @param lambda       - Base lambda
 * @param injuryFactor - 0.0-1.0, where 1.0 = full strength, 0.85 = significant injuries
 */
export function applyInjuryWeight(lambda: number, injuryFactor: number = 1.0): number {
    return lambda * Math.max(0.80, Math.min(1.0, injuryFactor));
}

/**
 * Get per-league home advantage multiplier.
 * Falls back to DEFAULT if league not configured.
 */
export function getLeagueHomeAdvantage(leagueId: number): number {
    return LEAGUE_HOME_ADVANTAGES[leagueId] ?? POISSON_CONFIG.HOME_ADVANTAGE;
}

// ============ SCORE MATRIX (Step 7) ============

/** 7×7 score probability matrix: P(i, j) = P_home(i) × P_away(j) */
export interface ScoreMatrix {
    matrix: number[][];       // matrix[homeGoals][awayGoals]
    homeDist: number[];       // P(home scores k)
    awayDist: number[];       // P(away scores k)
    lambdaHome: number;
    lambdaAway: number;
}

export function buildScoreMatrix(lambdaHome: number, lambdaAway: number): ScoreMatrix {
    const homeDist = poissonDistribution(lambdaHome);
    const awayDist = poissonDistribution(lambdaAway);

    const matrix: number[][] = [];
    for (let i = 0; i <= MAX_GOALS; i++) {
        matrix[i] = [];
        for (let j = 0; j <= MAX_GOALS; j++) {
            matrix[i][j] = homeDist[i] * awayDist[j];
        }
    }

    return { matrix, homeDist, awayDist, lambdaHome, lambdaAway };
}

// ============ MARKET PROBABILITIES (Step 8) ============
// All derived strictly from matrix summation. No shortcuts.
// Removed: home_under_3_5, away_under_3_5, dc_* (Double Chance)

export interface MarketProbabilities {
    // Goals
    over_1_5: number;
    over_2_5: number;
    over_3_5: number;
    under_1_5: number;
    under_2_5: number;
    under_4_5: number;

    // BTTS
    btts_yes: number;
    btts_no: number;

    // Combined BTTS + Goals
    btts_over_2_5: number;
    btts_over_3_5: number;
    btts_under_1_5: number;
    btts_under_2_5: number;

    // Team Totals
    home_over_1_5: number;
    away_over_1_5: number;

    // Result (1X2)
    home_win: number;
    draw: number;
    away_win: number;

    // Draw No Bet
    dnb_home: number;
    dnb_away: number;

    // BTTS & Result
    btts_home_win: number;
    btts_away_win: number;

    // 1st Half
    first_half_over_0_5: number;
    first_half_over_1_5: number;
    first_half_over_2_5: number;
    first_half_under_0_5: number;
    first_half_under_1_5: number;

    // Correct Scores (top probabilities)
    correct_scores: { home: number; away: number; probability: number }[];
}

export function deriveMarketProbabilities(sm: ScoreMatrix): MarketProbabilities {
    const { matrix, homeDist, awayDist, lambdaHome, lambdaAway } = sm;
    const N = MAX_GOALS;

    // --- Goals totals ---
    const pTotalGoals: number[] = new Array(2 * N + 1).fill(0);
    for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
            pTotalGoals[i + j] += matrix[i][j];
        }
    }

    const cumTotal = (max: number) => {
        let sum = 0;
        for (let k = 0; k <= Math.min(max, pTotalGoals.length - 1); k++) sum += pTotalGoals[k];
        return sum;
    };

    const over_1_5 = 1 - cumTotal(1);
    const over_2_5 = 1 - cumTotal(2);
    const over_3_5 = 1 - cumTotal(3);
    const under_1_5 = cumTotal(1);
    const under_2_5 = cumTotal(2);
    const under_4_5 = cumTotal(4);

    // --- BTTS ---
    const pHomeScores = 1 - homeDist[0];
    const pAwayScores = 1 - awayDist[0];
    const btts_yes = pHomeScores * pAwayScores;
    const btts_no = 1 - btts_yes;

    // --- BTTS & Goals (from matrix) ---
    let btts_over_2_5 = 0;
    let btts_over_3_5 = 0;
    let btts_under_1_5 = 0;
    let btts_under_2_5 = 0;
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
            const total = i + j;
            if (total > 3) btts_over_3_5 += matrix[i][j];
            if (total > 2) btts_over_2_5 += matrix[i][j];
            if (total <= 1) btts_under_1_5 += matrix[i][j]; // impossible (BTTS min=2), stays 0
            if (total <= 2) btts_under_2_5 += matrix[i][j]; // only 1-1
        }
    }

    // --- Team Totals ---
    let home_over_1_5 = 0;
    let away_over_1_5 = 0;
    for (let k = 2; k <= N; k++) {
        home_over_1_5 += homeDist[k];
        away_over_1_5 += awayDist[k];
    }

    // --- Result (1X2) from matrix ---
    let home_win = 0, draw = 0, away_win = 0;
    for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
            if (i > j) home_win += matrix[i][j];
            else if (i === j) draw += matrix[i][j];
            else away_win += matrix[i][j];
        }
    }

    // --- Draw No Bet ---
    const dnb_home = home_win / (home_win + away_win);
    const dnb_away = away_win / (home_win + away_win);

    // --- BTTS & Result (from matrix) ---
    let btts_home_win = 0, btts_away_win = 0;
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
            if (i > j) btts_home_win += matrix[i][j];
            if (j > i) btts_away_win += matrix[i][j];
        }
    }

    // --- 1st Half (Poisson with half-time λ) ---
    const lambdaFirstHalf = (lambdaHome + lambdaAway) * HALF_TIME_FACTOR;
    const e1H = Math.exp(-lambdaFirstHalf);
    const p1H_0 = e1H;                                         // P(0 goals)
    const p1H_1 = lambdaFirstHalf * e1H;                       // P(1 goal)
    const p1H_2 = (lambdaFirstHalf ** 2 / 2) * e1H;            // P(2 goals)

    const first_half_over_0_5 = 1 - p1H_0;
    const first_half_under_0_5 = p1H_0;
    const first_half_under_1_5 = p1H_0 + p1H_1;
    const first_half_over_1_5 = 1 - first_half_under_1_5;
    const first_half_over_2_5 = 1 - (p1H_0 + p1H_1 + p1H_2);

    // --- Correct Scores (top 5 by probability) ---
    const scores: { home: number; away: number; probability: number }[] = [];
    for (let i = 0; i <= Math.min(4, N); i++) {
        for (let j = 0; j <= Math.min(4, N); j++) {
            scores.push({ home: i, away: j, probability: matrix[i][j] });
        }
    }
    scores.sort((a, b) => b.probability - a.probability);
    const correct_scores = scores.slice(0, 5);

    return {
        over_1_5, over_2_5, over_3_5,
        under_1_5, under_2_5, under_4_5,
        btts_yes, btts_no,
        btts_over_2_5, btts_over_3_5,
        btts_under_1_5, btts_under_2_5,
        home_over_1_5, away_over_1_5,
        home_win, draw, away_win,
        dnb_home, dnb_away,
        btts_home_win, btts_away_win,
        first_half_over_0_5, first_half_over_1_5, first_half_over_2_5,
        first_half_under_0_5, first_half_under_1_5,
        correct_scores,
    };
}

// ============ ATTACK / DEFENSE STRENGTH (Step 4) ============

export interface StrengthFactors {
    attackHome: number;
    defenseHome: number;
    attackAway: number;
    defenseAway: number;
}

export function calculateStrength(
    homeAvgScored: number,
    homeAvgConceded: number,
    awayAvgScored: number,
    awayAvgConceded: number,
    leagueAvgHomeGoals: number = 1.50,
    leagueAvgAwayGoals: number = 1.15,
): StrengthFactors {
    return {
        attackHome: homeAvgScored / leagueAvgHomeGoals,
        defenseHome: homeAvgConceded / leagueAvgAwayGoals,
        attackAway: awayAvgScored / leagueAvgAwayGoals,
        defenseAway: awayAvgConceded / leagueAvgHomeGoals,
    };
}

// ============ LAMBDA COMPUTATION (Step 5) ============

export function computeLambdas(
    strength: StrengthFactors,
    leagueAvgHomeGoals: number = 1.50,
    leagueAvgAwayGoals: number = 1.15,
    homeAdvantage: number = POISSON_CONFIG.HOME_ADVANTAGE,
): { lambdaHome: number; lambdaAway: number } {
    const lambdaHome = leagueAvgHomeGoals * strength.attackHome * strength.defenseAway * homeAdvantage;
    const lambdaAway = leagueAvgAwayGoals * strength.attackAway * strength.defenseHome;

    return {
        lambdaHome: Math.max(0.3, Math.min(4.0, lambdaHome)),
        lambdaAway: Math.max(0.2, Math.min(3.5, lambdaAway)),
    };
}
