/**
 * PitchPulse Edge Engine — ACCA Freeze Module
 *
 * Builds curated 5-fold WIN-only accumulators optimized for SkyBet's Acca Freeze:
 *   - 4 Safe Legs (odds 1.30–2.00) — high-probability wins
 *   - 1 Freeze Leg (odds 2.50–20.50) — hardest-to-hit pick, user freezes on SkyBet
 *
 * Pipeline:
 *   1. Filter daily predictions into safe and freeze candidate pools
 *   2. Generate C(n,4) safe combinations + best freeze leg
 *   3. Rank by safe combined probability (want safes to land)
 *   4. Calculate freeze value + recommendation as legs settle
 */

import type { MatchPrediction } from './engine';

// ============ TYPES ============

export type LegStatus = 'pending' | 'won' | 'lost' | 'void';

export interface AccaLeg {
    fixtureId: number;
    marketId: string;
    team: string;
    odds: number;
    probability: number;
    confidence: number;
    startTime: string;
    leagueName: string;
    leagueId: number;
    homeLogo: string;
    awayLogo: string;
    homeTeam: string;
    awayTeam: string;
    status: LegStatus;
    isFreezeLeg: boolean;
}

export type FreezeRecommendation =
    | 'LET_IT_RIDE'
    | 'CONSIDER_FREEZING'
    | 'FREEZE_NOW'
    | 'ACCA_DEAD';

export interface AccaFreeze {
    id: string;
    legs: AccaLeg[];
    combinedOdds: number;
    combinedProbability: number;
    compositeConfidence: number;
    freezeValue: number;
    fullPayout: number;
    safeOddsProduct: number;
    freezeLegOdds: number;
    freezeRecommendation: FreezeRecommendation;
}

// ============ CONSTANTS ============

const SAFE_ODDS_MIN = 1.20;
const SAFE_ODDS_MAX = 2.00;
const FREEZE_ODDS_MIN = 3.00;
const FREEZE_ODDS_MAX = 22.50;
const MIN_EDGE_SCORE = 5.0;
const MAX_SAME_LEAGUE = 2;
const SAFE_LEG_COUNT = 4;
const DEFAULT_STAKE = 10;

// WIN-only market IDs from the engine
const WIN_MARKET_IDS = ['result_home', 'result_away', 'dnb_home', 'dnb_away'];

// ============ PREDICTION → LEG CONVERSION ============

/**
 * Convert a MatchPrediction to an AccaLeg.
 */
function predictionToLeg(pick: MatchPrediction, isFreezeLeg: boolean): AccaLeg {
    // For result markets, the "team" is the team predicted to win
    const team = pick.marketId.includes('home') ? pick.homeTeam : pick.awayTeam;

    return {
        fixtureId: pick.fixtureId,
        marketId: pick.marketId,
        team,
        odds: pick.odds,
        probability: pick.probability,
        confidence: pick.confidence,
        startTime: pick.startTime,
        leagueName: pick.leagueName,
        leagueId: pick.leagueId,
        homeLogo: pick.homeLogo,
        awayLogo: pick.awayLogo,
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        status: 'pending',
        isFreezeLeg,
    };
}

// ============ FILTERING ============

/**
 * Filter predictions to safe legs: WIN-only, odds 1.20–2.00, edge ≥ 5.
 * Returns at most MAX_SAME_LEAGUE per league.
 */
export function filterSafeLegs(picks: MatchPrediction[]): AccaLeg[] {
    const winPicks = picks.filter(p =>
        WIN_MARKET_IDS.includes(p.marketId) &&
        p.odds >= SAFE_ODDS_MIN &&
        p.odds <= SAFE_ODDS_MAX &&
        p.edgeScore >= MIN_EDGE_SCORE
    );

    // Sort by probability descending (most likely to win first)
    winPicks.sort((a, b) => b.probability - a.probability);

    // Enforce max per league
    const leagueCounts = new Map<number, number>();
    const filtered: MatchPrediction[] = [];

    for (const pick of winPicks) {
        const count = leagueCounts.get(pick.leagueId) ?? 0;
        if (count < MAX_SAME_LEAGUE) {
            filtered.push(pick);
            leagueCounts.set(pick.leagueId, count + 1);
        }
    }

    // Take top results and sort by startTime ascending (chronological)
    return filtered.map(p => predictionToLeg(p, false))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Filter predictions to freeze legs: WIN-only, odds 3.00–22.50.
 * Refined for "Score First" strategy:
 *   - Edge Score ≥ 3.0
 *   - Score First Probability (λ_predicted / λ_total) ≥ 0.55
 *   - DE-DUPLICATED: Each match appears only once in the pool.
 * Sorted by highest Score First probability for the underdog.
 */
export function filterFreezeLegs(picks: MatchPrediction[]): AccaLeg[] {
    // 1. Filter all matches that are win markets and in odds range
    const allCandidates = picks.filter(p =>
        WIN_MARKET_IDS.includes(p.marketId) &&
        p.odds >= FREEZE_ODDS_MIN &&
        p.odds <= FREEZE_ODDS_MAX
    );

    // 2. De-duplicate by fixtureId (keep best market per fixture based on Score First probability)
    const uniqueFixtures = new Map<number, MatchPrediction>();
    for (const p of allCandidates) {
        const totalLambda = p.lambdaHome + p.lambdaAway;
        const predictedLambda = p.marketId.includes('home') ? p.lambdaHome : p.lambdaAway;
        const currentScoreFirstProb = totalLambda > 0 ? predictedLambda / totalLambda : 0;

        const existing = uniqueFixtures.get(p.fixtureId);
        if (!existing) {
            uniqueFixtures.set(p.fixtureId, p);
        } else {
            const existingTotalLambda = existing.lambdaHome + existing.lambdaAway;
            const existingPredictedLambda = existing.marketId.includes('home') ? existing.lambdaHome : existing.lambdaAway;
            const existingScoreFirstProb = existingTotalLambda > 0 ? existingPredictedLambda / existingTotalLambda : 0;

            if (currentScoreFirstProb > existingScoreFirstProb) {
                uniqueFixtures.set(p.fixtureId, p);
            }
        }
    }

    const freezePicks = Array.from(uniqueFixtures.values());

    // 3. Rank by "Freeze Potential": Score First Probability weighted by Underdog Odds
    // Formula: ScoreFirstProb * (1 + Odds/20) - Prioritizes high-odds "lightning strikes"
    freezePicks.sort((a, b) => {
        const getScore = (p: MatchPrediction) => {
            const totalLambda = p.lambdaHome + p.lambdaAway;
            const predLambda = p.marketId.includes('home') ? p.lambdaHome : p.lambdaAway;
            const firstProb = totalLambda > 0 ? predLambda / totalLambda : 0;
            // Weighted by odds to favor the "weaker" team as requested
            return firstProb * (1 + (p.odds / 20));
        };

        return getScore(b) - getScore(a);
    });

    // 4. Take top 15 premium picks and sort by startTime ascending (chronological)
    return freezePicks.slice(0, 15)
        .map(p => predictionToLeg(p, true))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ============ SCORING ============

/**
 * Compute combined odds, probability, and confidence for a set of legs.
 */
export function scoreAcca(legs: AccaLeg[]): {
    combinedOdds: number;
    combinedProbability: number;
    compositeConfidence: number;
} {
    const combinedOdds = legs.reduce((prod, leg) => prod * leg.odds, 1);
    const combinedProbability = legs.reduce((prod, leg) => prod * leg.probability, 1);

    // Weighted average confidence, weighted by each leg's probability contribution
    const totalProb = legs.reduce((sum, leg) => sum + leg.probability, 0);
    const compositeConfidence = totalProb > 0
        ? Math.round(legs.reduce((sum, leg) => sum + leg.confidence * (leg.probability / totalProb), 0))
        : 0;

    return {
        combinedOdds: Math.round(combinedOdds * 100) / 100,
        combinedProbability: Math.round(combinedProbability * 10000) / 10000,
        compositeConfidence,
    };
}

// ============ COMBINATION GENERATION ============

/**
 * Generate all C(n, k) combinations from an array.
 */
function combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];

    const result: T[][] = [];

    function backtrack(start: number, current: T[]) {
        if (current.length === k) {
            result.push([...current]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }

    backtrack(0, []);
    return result;
}

/**
 * Check if a combo respects league diversity (max 2 per league).
 */
function isLeagueDiversified(legs: AccaLeg[]): boolean {
    const leagueCounts = new Map<number, number>();
    for (const leg of legs) {
        const count = (leagueCounts.get(leg.leagueId) ?? 0) + 1;
        if (count > MAX_SAME_LEAGUE) return false;
        leagueCounts.set(leg.leagueId, count);
    }
    return true;
}

/**
 * Build the top N ACCA combinations.
 *
 * Algorithm:
 *   1. Generate all C(n, 4) safe leg combinations
 *   2. For each, pair with multiple freeze leg candidates
 *   3. Collect ALL valid candidates
 *   4. Select top candidates while enforcing freeze leg variety
 *   5. Return top `count`
 */
export function buildAccas(
    safeLegs: AccaLeg[],
    freezeLegs: AccaLeg[],
    count: number = 2,
    stake: number = DEFAULT_STAKE,
): AccaFreeze[] {
    if (safeLegs.length < SAFE_LEG_COUNT || freezeLegs.length < 1) {
        return [];
    }

    // Generate all 4-safe combinations
    const safeCombos = combinations(safeLegs, SAFE_LEG_COUNT);

    // Score and pair each combo
    const candidates: AccaFreeze[] = [];

    for (const safeCombo of safeCombos) {
        // Check league diversity within safe legs
        if (!isLeagueDiversified(safeCombo)) continue;

        const safeFixtureIds = new Set(safeCombo.map(l => l.fixtureId));
        const safeLeagueIds = new Map<number, number>();
        for (const leg of safeCombo) {
            safeLeagueIds.set(leg.leagueId, (safeLeagueIds.get(leg.leagueId) ?? 0) + 1);
        }

        // Try to pair with top 3 possible freeze legs for this combo (instead of just 1)
        const availableFreezeLegs = freezeLegs.filter(f => {
            if (safeFixtureIds.has(f.fixtureId)) return false;
            const leagueCount = safeLeagueIds.get(f.leagueId) ?? 0;
            if (leagueCount >= MAX_SAME_LEAGUE) return false;
            return true;
        }).slice(0, 3);

        for (const freezeCandidate of availableFreezeLegs) {
            const allLegs = [...safeCombo, freezeCandidate];
            const { combinedOdds, combinedProbability, compositeConfidence } = scoreAcca(allLegs);

            const safeOddsProduct = safeCombo.reduce((prod, l) => prod * l.odds, 1);
            const fullPayout = Math.round(stake * combinedOdds * 100) / 100;
            const freezeValue = calculateFreezeValue(allLegs, stake);
            const recommendation = getFreezeRecommendation(freezeValue, stake);

            candidates.push({
                id: `acca_${Date.now()}_${candidates.length}`,
                legs: allLegs,
                combinedOdds,
                combinedProbability,
                compositeConfidence,
                freezeValue,
                fullPayout,
                safeOddsProduct: Math.round(safeOddsProduct * 100) / 100,
                freezeLegOdds: freezeCandidate.odds,
                freezeRecommendation: recommendation,
            });
        }
    }

    // Rank primarily by safe combined probability descending
    candidates.sort((a, b) => {
        const safeA = a.legs.filter(l => !l.isFreezeLeg).reduce((p, l) => p * l.probability, 1);
        const safeB = b.legs.filter(l => !l.isFreezeLeg).reduce((p, l) => p * l.probability, 1);
        return safeB - safeA;
    });

    // Select top N while enforcing variety in freeze legs
    const selected: AccaFreeze[] = [];
    const usedFreezeFixtures = new Set<number>();

    // Pass 1: Prioritize unique freeze legs
    for (const candidate of candidates) {
        if (selected.length >= count) break;
        const freezeLeg = candidate.legs.find(l => l.isFreezeLeg);
        if (freezeLeg && !usedFreezeFixtures.has(freezeLeg.fixtureId)) {
            selected.push(candidate);
            usedFreezeFixtures.add(freezeLeg.fixtureId);
        }
    }

    // Pass 2: Fill remaining slots with next best candidates (allow repeat freeze if needed)
    if (selected.length < count) {
        for (const candidate of candidates) {
            if (selected.length >= count) break;
            if (!selected.find(s => s.id === candidate.id)) {
                selected.push(candidate);
            }
        }
    }

    // FINAL STEP: Sort legs within each selected ACCA by startTime ascending
    for (const acca of selected) {
        acca.legs.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return selected;
}

// ============ FREEZE CALCULATION ============

/**
 * Calculate the theoretical freeze value.
 *
 * Formula:
 *   settledOddsProduct = product of odds for WON legs
 *   remainingProbability = product of probabilities for PENDING legs
 *   freezeValue = stake × settledOddsProduct × remainingProbability
 */
export function calculateFreezeValue(
    legs: AccaLeg[],
    stake: number = DEFAULT_STAKE,
): number {
    // If any leg lost, freeze value is 0
    if (legs.some(l => l.status === 'lost')) return 0;

    const wonLegs = legs.filter(l => l.status === 'won');
    const pendingLegs = legs.filter(l => l.status === 'pending');

    const settledOddsProduct = wonLegs.reduce((prod, l) => prod * l.odds, 1);
    const remainingProbability = pendingLegs.reduce((prod, l) => prod * l.probability, 1);

    const freezeValue = stake * settledOddsProduct * remainingProbability;
    return Math.round(freezeValue * 100) / 100;
}

/**
 * Get the freeze recommendation based on current freeze value vs stake.
 */
export function getFreezeRecommendation(
    freezeValue: number,
    stake: number = DEFAULT_STAKE,
): FreezeRecommendation {
    // If freeze is 0, a leg has lost
    if (freezeValue === 0) return 'ACCA_DEAD';

    if (freezeValue < stake) return 'LET_IT_RIDE';
    if (freezeValue >= stake * 2) return 'FREEZE_NOW';
    return 'CONSIDER_FREEZING';
}
