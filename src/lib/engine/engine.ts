/**
 * PitchPulse Master Engine — Central Orchestrator
 * 
 * Implements the full 15-step pipeline:
 *   Steps 3-4: Data input + Attack/Defense strength
 *   Step 5:    λ computation
 *   Step 6:    Poisson distribution
 *   Step 7:    Score probability matrix
 *   Step 8:    Market probability derivation
 *   Step 9:    EV computation
 *   Step 10:   Hard filtering
 *   Step 11:   Confidence model
 *   Step 12:   Final match selection (3-6 Elite + all Safe)
 *   Step 13:   Immutable history publication
 *   Step 14:   Anti-mistake validation
 */

import { ELITE_CONFIG, SAFE_CONFIG, CONFIDENCE_WEIGHTS, POISSON_CONFIG } from './config';
import {
    calculateStrength,
    computeLambdas,
    buildScoreMatrix,
    deriveMarketProbabilities,
    type ScoreMatrix,
    type MarketProbabilities,
} from './poisson';
import {
    MARKET_WHITELIST,
    evaluateMarket,
    applyHardFilters,
    type EvaluatedMarket,
    type MarketDefinition,
} from './markets';
import { validateBeforePublish, areCorrelated } from './validation';
import { PredictionHistory, type ImmutablePrediction } from './history';

// ============ TYPES ============

/** Input data for computing a prediction (from SportMonks API) */
export interface MatchInput {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo: string;
    awayLogo: string;
    leagueName: string;
    leagueId: number;
    startTime: string;
    date: string;
    isLive: boolean;
    seasonId?: number;
    // Stats (from standings)
    homeAvgScored?: number;
    homeAvgConceded?: number;
    awayAvgScored?: number;
    awayAvgConceded?: number;
    homeRank?: number;
    awayRank?: number;
    homeGamesPlayed?: number;
    awayGamesPlayed?: number;
    // Form (from recent matches)
    homeFormScored?: number;
    homeFormConceded?: number;
    homeFormPPG?: number;
    awayFormScored?: number;
    awayFormConceded?: number;
    awayFormPPG?: number;
}

/** Output for a single match — used by the UI */
export interface MatchPrediction {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeLogo: string;
    awayLogo: string;
    leagueName: string;
    leagueId: number;
    startTime: string;
    date: string;
    isLive: boolean;
    // Prediction
    tier: 'elite' | 'safe';
    market: string;              // Display label (e.g. "Over 2.5 Goals")
    marketId: string;            // Internal key
    probability: number;         // P_model (0-1)
    odds: number;
    bet365Odds: number | null;
    bestBookmaker: string;
    edge: number;
    evAdjusted: number;
    confidence: number;
    // Computed
    lambdaHome: number;
    lambdaAway: number;
    isLocked: boolean;           // true once published to immutable history
    checksum?: string;
}

/** Complete engine output for a day/range of matches */
export interface EngineOutput {
    elitePicks: MatchPrediction[];   // Max 6 — Dashboard featured
    safePicks: MatchPrediction[];    // All other matches — Terminal page
    totalMatches: number;
    totalElite: number;
    totalSafe: number;
    generatedAt: string;
}

// ============ CONFIDENCE MODEL (Step 11) ============

function calculateConfidence(input: MatchInput): number {
    const w = CONFIDENCE_WEIGHTS;

    // Attack Stability: How consistent is the team's scoring?
    // High games played + reasonable avg = stable
    const homeGP = input.homeGamesPlayed ?? 10;
    const awayGP = input.awayGamesPlayed ?? 10;
    const sampleScore = Math.min(100, ((homeGP + awayGP) / 40) * 100);
    const attackStability = sampleScore;

    // Defensive Consistency: Low concession variance
    const homeAvgC = input.homeAvgConceded ?? 1.2;
    const awayAvgC = input.awayAvgConceded ?? 1.2;
    const defensiveConsistency = Math.min(100, 100 - Math.abs(homeAvgC - awayAvgC) * 30);

    // Market Stability: Rank proximity suggests more predictable outcomes
    const homeRank = input.homeRank ?? 10;
    const awayRank = input.awayRank ?? 10;
    const rankGap = Math.abs(homeRank - awayRank);
    const marketStability = Math.min(100, 90 - rankGap * 2);

    // Form Reliability: Recent PPG convergence
    const homePPG = input.homeFormPPG ?? 1.0;
    const awayPPG = input.awayFormPPG ?? 1.0;
    const formReliability = Math.min(100, 80 + (homePPG + awayPPG) * 5);

    // Injury Stability: Placeholder (no injury data from API)
    const injuryStability = 75; // Neutral default

    const raw =
        w.ATTACK_STABILITY * attackStability +
        w.DEFENSIVE_CONSISTENCY * defensiveConsistency +
        w.MARKET_STABILITY * marketStability +
        w.FORM_RELIABILITY * formReliability +
        w.INJURY_STABILITY * injuryStability;

    return Math.min(95, Math.max(40, Math.round(raw)));
}

// ============ WEIGHTED AVERAGES (Step 3) ============

/**
 * Blend seasonal averages with recent form: 40% season + 60% form.
 * This is the "momentum adjustment" from Step 3-4.
 */
function blendStats(
    seasonAvgScored: number | undefined,
    seasonAvgConceded: number | undefined,
    formScored: number | undefined,
    formConceded: number | undefined,
): { avgScored: number; avgConceded: number } {
    const sS = seasonAvgScored ?? 1.3;
    const sC = seasonAvgConceded ?? 1.1;
    const fS = formScored ?? sS;
    const fC = formConceded ?? sC;

    return {
        avgScored: sS * 0.4 + fS * 0.6,
        avgConceded: sC * 0.4 + fC * 0.6,
    };
}

// ============ ODDS MATCHING ============

interface OddsEntry {
    bookmaker_id: number;
    bookmaker_name: string;
    market_id: number;
    label: string;
    odds_name: string;
    odds_value: number;
}

/**
 * Find the best odds for a given market definition from fetched odds data.
 */
function findOddsForMarket(
    odds: OddsEntry[],
    market: MarketDefinition,
    homeTeam: string,
    awayTeam: string,
): { bestOdds: number; bet365Odds: number | null; bestBookmaker: string } | null {
    if (odds.length === 0) return null;

    // Filter by market IDs
    let filtered = odds.filter(o => market.sportmonksMarketIds.includes(o.market_id));
    if (filtered.length === 0) return null;

    // Filter by label
    if (market.sportmonksLabel) {
        const labelLower = market.sportmonksLabel.toLowerCase();
        const labelFiltered = filtered.filter(o => {
            const oLabel = o.label?.toLowerCase() || '';
            // For combined labels like "Over 2.5 & Yes", check all parts
            const parts = labelLower.split('&').map(s => s.trim());
            return parts.every(part => oLabel.includes(part));
        });
        if (labelFiltered.length > 0) filtered = labelFiltered;
        else return null;
    }

    // Filter by name/threshold
    if (market.sportmonksName) {
        const nameFiltered = filtered.filter(o =>
            o.odds_name === market.sportmonksName ||
            o.label?.includes(market.sportmonksName!)
        );
        if (nameFiltered.length > 0) filtered = nameFiltered;
        else return null;
    }

    // For team-specific markets, match by team name
    if (market.isTeamSpecific && market.teamSide) {
        const teamName = market.teamSide === 'home' ? homeTeam : awayTeam;
        const teamPrefix = teamName.toLowerCase().substring(0, 5);
        const teamFiltered = filtered.filter(o =>
            o.label?.toLowerCase().includes(teamPrefix)
        );
        if (teamFiltered.length > 0) filtered = teamFiltered;
        // Don't return null — some markets use Home/Away labels instead of team names
    }

    if (filtered.length === 0) return null;

    // Find best odds and bet365 odds
    const sorted = [...filtered].sort((a, b) => b.odds_value - a.odds_value);
    const best = sorted[0];
    const bet365 = sorted.find(o => o.bookmaker_id === 2);

    return {
        bestOdds: best.odds_value,
        bet365Odds: bet365?.odds_value ?? null,
        bestBookmaker: best.bookmaker_name,
    };
}

// ============ MAIN ENGINE PIPELINE ============

/**
 * Process a single match through the full engine pipeline.
 * Returns the best Elite and/or Safe pick for this match.
 */
export function processMatch(
    input: MatchInput,
    odds: OddsEntry[],
): { elite: EvaluatedMarket | null; safe: EvaluatedMarket | null; lambdaHome: number; lambdaAway: number; confidence: number } {
    // STEP 3-4: Blend stats and compute strength
    const homeBlend = blendStats(
        input.homeAvgScored, input.homeAvgConceded,
        input.homeFormScored, input.homeFormConceded
    );
    const awayBlend = blendStats(
        input.awayAvgScored, input.awayAvgConceded,
        input.awayFormScored, input.awayFormConceded
    );

    const strength = calculateStrength(
        homeBlend.avgScored, homeBlend.avgConceded,
        awayBlend.avgScored, awayBlend.avgConceded,
    );

    // STEP 5: Compute λ
    const { lambdaHome, lambdaAway } = computeLambdas(strength);

    // STEP 6-7: Poisson distribution → Score matrix
    const scoreMatrix = buildScoreMatrix(lambdaHome, lambdaAway);

    // STEP 8: Derive all market probabilities
    const probs = deriveMarketProbabilities(scoreMatrix);

    // STEP 11: Confidence model
    const confidence = calculateConfidence(input);

    // STEP 9-10: Evaluate all whitelisted markets with odds, then hard filter
    const eliteCandidates: EvaluatedMarket[] = [];
    const safeCandidates: EvaluatedMarket[] = [];

    for (const market of MARKET_WHITELIST) {
        // Get probability from computed probabilities
        let probability: number;

        if (market.probKey === null) {
            // Correct score — handle separately
            if (market.id === 'correct_score') {
                for (const cs of probs.correct_scores) {
                    const scoreline = `${cs.home}-${cs.away}`;
                    const oddsData = findOddsForMarket(odds, market, input.homeTeam, input.awayTeam);
                    if (!oddsData) continue;

                    const evaluated = evaluateMarket(
                        market, cs.probability, oddsData.bestOdds,
                        oddsData.bet365Odds, oddsData.bestBookmaker,
                        confidence, input.homeTeam, input.awayTeam, scoreline
                    );
                    if (!evaluated) continue;

                    const filtered = applyHardFilters(evaluated);
                    if (filtered) eliteCandidates.push(filtered);
                }
                continue;
            }
            continue;
        }

        probability = probs[market.probKey] as number;
        if (typeof probability !== 'number' || probability <= 0) continue;

        // Find matching odds from bookmaker data
        const oddsData = findOddsForMarket(odds, market, input.homeTeam, input.awayTeam);
        if (!oddsData) continue;

        // Evaluate for the market's native tier
        const evaluated = evaluateMarket(
            market, probability, oddsData.bestOdds,
            oddsData.bet365Odds, oddsData.bestBookmaker,
            confidence, input.homeTeam, input.awayTeam
        );
        if (!evaluated) continue;

        // Apply hard filters
        if (market.tier === 'elite' || market.tier === 'both') {
            const eliteEval = { ...evaluated, tier: 'elite' as const };
            const eliteFiltered = applyHardFilters(eliteEval);
            if (eliteFiltered) eliteCandidates.push(eliteFiltered);
        }

        if (market.tier === 'safe' || market.tier === 'both') {
            const safeEval = { ...evaluated, tier: 'safe' as const };
            const safeFiltered = applyHardFilters(safeEval);
            if (safeFiltered) safeCandidates.push(safeFiltered);
        }
    }

    // STEP 12: Select best from each tier (ranked by score = EV_adj × confidence)
    const sortByScore = (a: EvaluatedMarket, b: EvaluatedMarket) => b.score - a.score;

    const bestElite = eliteCandidates.sort(sortByScore)[0] ?? null;
    const bestSafe = safeCandidates.sort(sortByScore)[0] ?? null;

    // STEP 14: Final validation
    let validElite: EvaluatedMarket | null = null;
    let validSafe: EvaluatedMarket | null = null;

    if (bestElite) {
        const validation = validateBeforePublish(bestElite);
        if (validation.passed) validElite = bestElite;
    }

    if (bestSafe) {
        const validation = validateBeforePublish(bestSafe);
        if (validation.passed) validSafe = bestSafe;
    }

    return { elite: validElite, safe: validSafe, lambdaHome, lambdaAway, confidence };
}

/**
 * STEP 12: Select top 3-6 elite picks from all processed matches.
 * Applies correlation detection to avoid overlapping picks.
 */
export function selectDashboardPicks(allElite: MatchPrediction[]): MatchPrediction[] {
    // Sort by EV_adjusted × confidence (descending)
    const sorted = [...allElite].sort((a, b) =>
        (b.evAdjusted * b.confidence) - (a.evAdjusted * a.confidence)
    );

    const selected: MatchPrediction[] = [];

    for (const pick of sorted) {
        if (selected.length >= ELITE_CONFIG.MAX_PICKS) break;

        // No correlation check needed across different matches
        // (correlation is only between markets for the SAME match, already handled)
        selected.push(pick);
    }

    return selected;
}

/**
 * Convert an EvaluatedMarket + MatchInput into a MatchPrediction.
 */
export function toMatchPrediction(
    input: MatchInput,
    market: EvaluatedMarket,
    lambdaHome: number,
    lambdaAway: number,
    isLocked: boolean,
    checksum?: string,
): MatchPrediction {
    return {
        fixtureId: input.fixtureId,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        homeLogo: input.homeLogo,
        awayLogo: input.awayLogo,
        leagueName: input.leagueName,
        leagueId: input.leagueId,
        startTime: input.startTime,
        date: input.date,
        isLive: input.isLive,
        tier: market.tier as 'elite' | 'safe',
        market: market.label,
        marketId: market.marketId,
        probability: market.probability,
        odds: market.odds,
        bet365Odds: market.bet365Odds,
        bestBookmaker: market.bestBookmaker,
        edge: market.edge,
        evAdjusted: market.evAdjusted,
        confidence: market.confidence,
        lambdaHome,
        lambdaAway,
        isLocked,
        checksum,
    };
}

/**
 * Publish a prediction to immutable history.
 * Returns the checksum if successful.
 */
export async function publishPrediction(prediction: MatchPrediction): Promise<string | null> {
    try {
        // Check if already published
        const exists = await PredictionHistory.exists(prediction.fixtureId);
        if (exists) return null; // Already published — do not overwrite

        const record = await PredictionHistory.publish({
            fixture_id: prediction.fixtureId,
            lambda_home: prediction.lambdaHome,
            lambda_away: prediction.lambdaAway,
            market: prediction.market,
            market_id: prediction.marketId,
            p_model: prediction.probability,
            odds: prediction.odds,
            ev_adjusted: prediction.evAdjusted,
            confidence: prediction.confidence,
            home_team: prediction.homeTeam,
            away_team: prediction.awayTeam,
            league_name: prediction.leagueName,
            tier: prediction.tier,
            published_at: new Date().toISOString(),
            bet365_odds: prediction.bet365Odds,
            best_bookmaker: prediction.bestBookmaker,
            edge: prediction.edge,
        });

        return record.checksum;
    } catch (e) {
        console.error('[Engine] Publish error:', e);
        return null;
    }
}
