/**
 * PitchPulse Edge Engine — Elo Ratings & Bayesian Update Module
 * 
 * Converts league standings and form data into Elo-like ratings.
 * Applies Bayesian updating to adjust probabilities based on recent evidence.
 * 
 * Formulas:
 *   Elo_team = 1500 + (20 - rank) × K_factor
 *   E(home) = 1 / (1 + 10^((Elo_away - Elo_home) / 400))
 *   Bayesian posterior ∝ prior × likelihood^(sampleWeight)
 */

// ============ TYPES ============

export interface EloRating {
    home: number;               // Elo score (centered around 1500)
    away: number;
    expectedHome: number;       // Expected win probability from Elo
    expectedAway: number;
    expectedDraw: number;
    strengthDelta: number;      // Absolute Elo difference
}

export interface BayesianAdjustment {
    adjustedProbability: number;
    priorWeight: number;
    evidenceWeight: number;
}

// ============ ELO COMPUTATION ============

const BASE_ELO = 1500;
const K_FACTOR = 25;           // Elo sensitivity per rank position
const DRAW_FACTOR = 0.26;     // Approximate draw probability baseline

/**
 * Compute Elo ratings from league rank and games played.
 * Higher rank (1st) → higher Elo. Form PPG provides momentum adjustment.
 */
export function computeEloRatings(
    homeRank: number,
    awayRank: number,
    homeGamesPlayed: number,
    awayGamesPlayed: number,
    homeFormPPG: number,
    awayFormPPG: number,
    leagueSize: number = 20,
): EloRating {
    // Base Elo from rank (1st place → +475, 20th → 0)
    const homeElo = BASE_ELO + (leagueSize - homeRank) * K_FACTOR;
    const awayElo = BASE_ELO + (leagueSize - awayRank) * K_FACTOR;

    // Form momentum adjustment: PPG deviation from neutral (1.0)
    // Scale by sample size reliability
    const homeSampleFactor = Math.min(1.0, homeGamesPlayed / 15);
    const awaySampleFactor = Math.min(1.0, awayGamesPlayed / 15);

    const homeFormBonus = (homeFormPPG - 1.0) * 50 * homeSampleFactor;
    const awayFormBonus = (awayFormPPG - 1.0) * 50 * awaySampleFactor;

    const adjustedHomeElo = homeElo + homeFormBonus;
    const adjustedAwayElo = awayElo + awayFormBonus;

    // Expected outcomes from Elo formula
    const eloDiff = adjustedAwayElo - adjustedHomeElo;
    const expectedHome = 1 / (1 + Math.pow(10, eloDiff / 400));
    const expectedAway = 1 / (1 + Math.pow(10, -eloDiff / 400));

    // Draw probability (estimated — Elo doesn't model draws directly)
    const drawProb = DRAW_FACTOR * (1 - Math.abs(expectedHome - expectedAway));
    const adjustedExpectedHome = expectedHome * (1 - drawProb);
    const adjustedExpectedAway = expectedAway * (1 - drawProb);

    return {
        home: adjustedHomeElo,
        away: adjustedAwayElo,
        expectedHome: adjustedExpectedHome,
        expectedAway: adjustedExpectedAway,
        expectedDraw: drawProb,
        strengthDelta: Math.abs(adjustedHomeElo - adjustedAwayElo),
    };
}

// ============ BAYESIAN UPDATING ============

/**
 * Bayesian update: adjust model probability using form evidence.
 * 
 * Formula:
 *   posterior ∝ prior × likelihood^(sampleWeight)
 *   Where sampleWeight = min(1, gamesPlayed / 20) — more data = stronger update
 * 
 * @param priorProbability - Base probability from Poisson model (0-1)
 * @param formSignal       - Evidence from recent form (0-1 scale)
 * @param sampleSize       - Number of games backing the evidence
 * @returns Adjusted probability
 */
export function bayesianUpdate(
    priorProbability: number,
    formSignal: number,
    sampleSize: number,
): BayesianAdjustment {
    // Sample weight — more games = more trust in evidence
    const evidenceWeight = Math.min(1.0, sampleSize / 20);
    const priorWeight = 1.0 - evidenceWeight * 0.4; // Prior keeps at least 60% weight

    // Bayesian-inspired blending (conjugate approximation)
    const posterior = priorProbability * priorWeight + formSignal * (1 - priorWeight);

    // Clamp to valid probability range
    const adjustedProbability = Math.max(0.01, Math.min(0.99, posterior));

    return {
        adjustedProbability,
        priorWeight,
        evidenceWeight,
    };
}

/**
 * Adjust Poisson lambdas using Elo strength differential.
 * 
 * If Elo says home is stronger than Poisson suggests → boost λ_home slightly.
 * Uses a conservative blending factor to avoid overriding the statistical model.
 */
export function adjustLambdasWithElo(
    lambdaHome: number,
    lambdaAway: number,
    eloRating: EloRating,
    blendFactor: number = 0.15, // 15% Elo influence on lambdas
): { lambdaHome: number; lambdaAway: number } {
    // Elo-implied goal expectation ratio
    const eloHomeRatio = eloRating.expectedHome / (eloRating.expectedHome + eloRating.expectedAway);
    const eloAwayRatio = 1 - eloHomeRatio;

    // Current Poisson ratio
    const totalLambda = lambdaHome + lambdaAway;
    const poissonHomeRatio = lambdaHome / totalLambda;

    // Blend Poisson with Elo
    const blendedHomeRatio = poissonHomeRatio * (1 - blendFactor) + eloHomeRatio * blendFactor;
    const blendedAwayRatio = 1 - blendedHomeRatio;

    return {
        lambdaHome: Math.max(0.3, totalLambda * blendedHomeRatio),
        lambdaAway: Math.max(0.2, totalLambda * blendedAwayRatio),
    };
}
