/**
 * PitchPulse Master Engine — Poisson Mathematics
 * 
 * Pure mathematical module. No side effects, no API calls.
 * All market probabilities are derived from the 7×7 score matrix.
 */

import { POISSON_CONFIG } from './config';

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

export interface MarketProbabilities {
    // Goals
    over_1_5: number;
    over_2_5: number;
    over_3_5: number;
    under_2_5: number;
    under_3_5: number;
    under_4_5: number;

    // BTTS
    btts_yes: number;
    btts_no: number;

    // Combined
    btts_over_2_5: number;
    btts_under_2_5: number;

    // Team Totals
    home_over_1_5: number;
    away_over_1_5: number;
    home_under_3_5: number;
    away_under_3_5: number;

    // Result (1X2)
    home_win: number;
    draw: number;
    away_win: number;

    // Draw No Bet
    dnb_home: number;
    dnb_away: number;

    // Double Chance
    dc_home_draw: number;
    dc_away_draw: number;
    dc_home_away: number;

    // BTTS & Result
    btts_home_win: number;
    btts_away_win: number;

    // 1st Half
    first_half_over_0_5: number;

    // Correct Scores (top probabilities)
    correct_scores: { home: number; away: number; probability: number }[];
}

export function deriveMarketProbabilities(sm: ScoreMatrix): MarketProbabilities {
    const { matrix, homeDist, awayDist, lambdaHome, lambdaAway } = sm;
    const N = MAX_GOALS;

    // --- Goals totals ---
    let pTotalGoals: number[] = new Array(2 * N + 1).fill(0);
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
    const under_2_5 = cumTotal(2);
    const under_3_5 = cumTotal(3);
    const under_4_5 = cumTotal(4);

    // --- BTTS ---
    // P(BTTS) = P(home ≥ 1) × P(away ≥ 1) — independent Poisson
    const pHomeScores = 1 - homeDist[0];
    const pAwayScores = 1 - awayDist[0];
    const btts_yes = pHomeScores * pAwayScores;
    const btts_no = 1 - btts_yes;

    // --- BTTS & Goals (from matrix, not product) ---
    let btts_over_2_5 = 0;
    let btts_under_2_5 = 0;
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
            if (i + j > 2) btts_over_2_5 += matrix[i][j];
            else btts_under_2_5 += matrix[i][j];
        }
    }

    // --- Team Totals ---
    let home_over_1_5 = 0;
    let away_over_1_5 = 0;
    for (let k = 2; k <= N; k++) {
        home_over_1_5 += homeDist[k];
        away_over_1_5 += awayDist[k];
    }

    let home_under_3_5 = 0;
    let away_under_3_5 = 0;
    for (let k = 0; k <= 3; k++) {
        home_under_3_5 += homeDist[k];
        away_under_3_5 += awayDist[k];
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

    // --- Double Chance ---
    const dc_home_draw = home_win + draw;
    const dc_away_draw = away_win + draw;
    const dc_home_away = home_win + away_win;

    // --- BTTS & Result (from matrix) ---
    let btts_home_win = 0, btts_away_win = 0;
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
            if (i > j) btts_home_win += matrix[i][j];
            if (j > i) btts_away_win += matrix[i][j];
        }
    }

    // --- 1st Half Over 0.5 ---
    // Approximation: λ_half ≈ λ_full × HALF_TIME_FACTOR
    const lambdaFirstHalf = (lambdaHome + lambdaAway) * HALF_TIME_FACTOR;
    const first_half_over_0_5 = 1 - Math.exp(-lambdaFirstHalf);

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
        under_2_5, under_3_5, under_4_5,
        btts_yes, btts_no,
        btts_over_2_5, btts_under_2_5,
        home_over_1_5, away_over_1_5,
        home_under_3_5, away_under_3_5,
        home_win, draw, away_win,
        dnb_home, dnb_away,
        dc_home_draw, dc_away_draw, dc_home_away,
        btts_home_win, btts_away_win,
        first_half_over_0_5,
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

/**
 * Calculate attack and defense strength relative to league averages.
 * 
 * Attack_home = xG_for_home / League_avg_home_goals
 * Defense_away = xGA_away / League_avg_home_goals
 * Attack_away = xG_for_away / League_avg_away_goals
 * Defense_home = xGA_home / League_avg_away_goals
 */
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
