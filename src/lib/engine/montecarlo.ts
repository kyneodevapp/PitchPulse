/**
 * PitchPulse Edge Engine — Monte Carlo Simulation Module
 * 
 * Runs 10,000 iterations per match to produce:
 *   - Simulation-based market probabilities
 *   - 95% confidence intervals
 *   - Outcome distribution histograms
 *   - Volatility scoring
 * 
 * Uses seeded PRNG for deterministic reproducibility.
 */

import { MONTE_CARLO_CONFIG } from './config';

// ============ TYPES ============

export interface SimulationResult {
    marketProbabilities: {
        over_2_5: number;
        over_3_5: number;
        under_1_5: number;
        under_2_5: number;
        btts_yes: number;
        btts_no: number;
        btts_over_2_5: number;
        btts_over_3_5: number;
        btts_under_1_5: number;
        btts_under_2_5: number;
        btts_home_win: number;
        btts_away_win: number;
        dnb_home: number;
        dnb_away: number;
        first_half_over_1_5: number;
        first_half_over_2_5: number;
        first_half_under_0_5: number;
        first_half_under_1_5: number;
    };
    confidenceIntervals: Record<string, [number, number]>; // 95% CI per market
    goalDistribution: number[];             // Frequency of total goals [0, 1, 2, ...]
    scorelines: Record<string, number>;     // Top scoreline frequencies
    meanGoals: { home: number; away: number };
    volatilityScore: number;                // 0-100 (lower = more stable)
    simulationCount: number;
}

// ============ SEEDED PRNG ============

class SeededRNG {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /** Xorshift32 — fast, deterministic PRNG */
    next(): number {
        let x = this.state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        this.state = x;
        return (x >>> 0) / 4294967296; // Normalize to [0, 1)
    }

    /** Sample from Poisson distribution using inverse CDF */
    poisson(lambda: number): number {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= this.next();
        } while (p > L);
        return k - 1;
    }
}

// ============ SIMULATION ============

/**
 * Run Monte Carlo simulation for a match.
 * 
 * @param lambdaHome - Expected home goals (Poisson λ)
 * @param lambdaAway - Expected away goals (Poisson λ)
 * @param fixtureId  - Used as seed for reproducibility
 * @param iterations - Number of simulation runs (default: 10,000)
 */
export function runMonteCarloSimulation(
    lambdaHome: number,
    lambdaAway: number,
    fixtureId: number,
    iterations: number = MONTE_CARLO_CONFIG.ITERATIONS,
): SimulationResult {
    const rng = new SeededRNG(fixtureId ^ MONTE_CARLO_CONFIG.SEED_BASE);
    const HALF_FACTOR = 0.45;

    // Counters — all 18 markets
    let over_2_5 = 0, over_3_5 = 0;
    let under_1_5 = 0, under_2_5 = 0;
    let btts_yes = 0, btts_no = 0;
    let btts_over_2_5 = 0, btts_over_3_5 = 0;
    let btts_under_1_5 = 0, btts_under_2_5 = 0;
    let btts_home_win = 0, btts_away_win = 0;
    let dnb_home = 0, dnb_away = 0;
    let fh_over_1_5 = 0, fh_over_2_5 = 0;
    let fh_under_0_5 = 0, fh_under_1_5 = 0;

    let totalHomeGoals = 0, totalAwayGoals = 0;
    const goalDist: number[] = new Array(13).fill(0);
    const scorelineCount: Record<string, number> = {};

    for (let i = 0; i < iterations; i++) {
        const hg = rng.poisson(lambdaHome);
        const ag = rng.poisson(lambdaAway);
        const total = hg + ag;

        // First half goals (separate Poisson)
        const hg1H = rng.poisson(lambdaHome * HALF_FACTOR);
        const ag1H = rng.poisson(lambdaAway * HALF_FACTOR);
        const total1H = hg1H + ag1H;

        totalHomeGoals += hg;
        totalAwayGoals += ag;

        // Goal totals
        if (total > 2) over_2_5++;
        if (total > 3) over_3_5++;
        if (total <= 1) under_1_5++;
        if (total <= 2) under_2_5++;

        // BTTS
        const isBTTS = hg >= 1 && ag >= 1;
        if (isBTTS) {
            btts_yes++;
            if (total > 2) btts_over_2_5++;
            if (total > 3) btts_over_3_5++;
            if (total <= 1) btts_under_1_5++;
            if (total <= 2) btts_under_2_5++;
            if (hg > ag) btts_home_win++;
            if (ag > hg) btts_away_win++;
        } else {
            btts_no++;
        }

        // DNB (exclude draws)
        if (hg > ag) dnb_home++;
        if (ag > hg) dnb_away++;

        // 1st half goals
        if (total1H > 1) fh_over_1_5++;
        if (total1H > 2) fh_over_2_5++;
        if (total1H === 0) fh_under_0_5++;
        if (total1H <= 1) fh_under_1_5++;

        // Distribution
        if (total < goalDist.length) goalDist[total]++;

        // Scoreline tracking
        const key = `${hg}-${ag}`;
        scorelineCount[key] = (scorelineCount[key] || 0) + 1;
    }

    const n = iterations;
    const nonDraws = dnb_home + dnb_away;

    // Market probabilities
    const marketProbabilities = {
        over_2_5: over_2_5 / n,
        over_3_5: over_3_5 / n,
        under_1_5: under_1_5 / n,
        under_2_5: under_2_5 / n,
        btts_yes: btts_yes / n,
        btts_no: btts_no / n,
        btts_over_2_5: btts_over_2_5 / n,
        btts_over_3_5: btts_over_3_5 / n,
        btts_under_1_5: btts_under_1_5 / n,
        btts_under_2_5: btts_under_2_5 / n,
        btts_home_win: btts_home_win / n,
        btts_away_win: btts_away_win / n,
        dnb_home: nonDraws > 0 ? dnb_home / nonDraws : 0.5,
        dnb_away: nonDraws > 0 ? dnb_away / nonDraws : 0.5,
        first_half_over_1_5: fh_over_1_5 / n,
        first_half_over_2_5: fh_over_2_5 / n,
        first_half_under_0_5: fh_under_0_5 / n,
        first_half_under_1_5: fh_under_1_5 / n,
    };

    // Confidence intervals using Wilson score interval approximation
    const confidenceIntervals: Record<string, [number, number]> = {};
    for (const [key, p] of Object.entries(marketProbabilities)) {
        const z = 1.96; // 95% CI
        const margin = z * Math.sqrt((p * (1 - p)) / n);
        confidenceIntervals[key] = [
            Math.max(0, p - margin),
            Math.min(1, p + margin),
        ];
    }

    // Volatility score
    const keyMarkets = ['over_2_5', 'btts_yes', 'dnb_home'];
    let ciWidthSum = 0;
    for (const km of keyMarkets) {
        const ci = confidenceIntervals[km];
        if (ci) ciWidthSum += (ci[1] - ci[0]);
    }
    const avgCIWidth = ciWidthSum / keyMarkets.length;
    const volatilityScore = Math.min(100, Math.round(avgCIWidth * 400));

    // Top scorelines
    const sortedScorelines = Object.entries(scorelineCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const topScorelines: Record<string, number> = {};
    for (const [key, count] of sortedScorelines) {
        topScorelines[key] = count / n;
    }

    return {
        marketProbabilities,
        confidenceIntervals,
        goalDistribution: goalDist.map(g => g / n),
        scorelines: topScorelines,
        meanGoals: {
            home: totalHomeGoals / n,
            away: totalAwayGoals / n,
        },
        volatilityScore,
        simulationCount: n,
    };
}

/**
 * Blend Poisson-derived probabilities with Monte Carlo results.
 * Weights: 40% Poisson (analytical), 60% Monte Carlo (empirical).
 */
export function blendProbabilities(
    poissonProb: number,
    mcProb: number,
    poissonWeight: number = 0.4,
): number {
    return poissonProb * poissonWeight + mcProb * (1 - poissonWeight);
}
