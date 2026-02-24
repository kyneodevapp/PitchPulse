/**
 * PitchPulse Edge Engine — Central Orchestrator
 * 
 * Institutional-grade prediction pipeline:
 *   1. Data input + Attack/Defense strength
 *   2. Elo ratings + Bayesian updating
 *   3. Fatigue & injury adjustments
 *   4. Poisson λ computation + Score matrix
 *   5. Monte Carlo simulation (10K iterations)
 *   6. Market probability blending (Poisson + MC)
 *   7. EV, Edge, CLV computation per market
 *   8. Risk assessment + Edge Score computation
 *   9. ONE best bet per match (highest Edge Score)
 *   10. Final validation & immutable publication
 */

import { ENGINE_CONFIG, CONFIDENCE_WEIGHTS, getCalibrationFactor } from './config';
import {
    calculateStrength,
    computeLambdas,
    buildScoreMatrix,
    deriveMarketProbabilities,
    applyFatigueAdjustment,
    applyInjuryWeight,
    getLeagueHomeAdvantage,
    type ScoreMatrix,
    type MarketProbabilities,
} from './poisson';
import {
    MARKET_WHITELIST,
    evaluateMarket,
    type EvaluatedMarket,
    type MarketDefinition,
} from './markets';
import { validateBeforePublish, areCorrelated } from './validation';
import { PredictionHistory, type ImmutablePrediction } from './history';
import { runMonteCarloSimulation, blendProbabilities, type SimulationResult } from './montecarlo';
import { computeEloRatings, bayesianUpdate, adjustLambdasWithElo } from './elo';
import { predictCLV, type CLVProjection } from './clv';
import { assessRisk, type RiskAssessment } from './risk';
import { computeEdgeScore, type EdgeScoreResult } from './edgeScore';
import type { RiskTierLabel } from './config';

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
    // Optional advanced data
    homeDaysRest?: number;
    awayDaysRest?: number;
    homeInjuryFactor?: number;  // 0.80-1.0 (1.0 = full strength)
    awayInjuryFactor?: number;
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
    market: string;              // Display label
    marketId: string;            // Internal key
    probability: number;         // P_model (0-1)
    impliedProbability: number;  // 1 / odds
    odds: number;
    bet365Odds: number | null;
    bestBookmaker: string;
    edge: number;
    ev: number;                  // Raw EV
    evAdjusted: number;          // Variance-adjusted EV
    confidence: number;
    // Edge Engine
    edgeScore: number;
    riskTier: RiskTierLabel;
    suggestedStake: number;      // Kelly-derived % of bankroll
    clvProjection: number;       // CLV %
    simulationWinFreq: number;   // e.g. 5820 out of 10000
    confidenceInterval: [number, number];
    // Computed
    lambdaHome: number;
    lambdaAway: number;
    isLocked: boolean;
    checksum?: string;
    // Simulation data (for analysis modal)
    goalDistribution?: number[];
    scorelines?: Record<string, number>;
}

/** Complete engine output for a day/range of matches */
export interface EngineOutput {
    picks: MatchPrediction[];    // One per match, ranked by Edge Score
    totalMatches: number;
    totalQualified: number;
    generatedAt: string;
}

// ============ CONFIDENCE MODEL ============

function calculateConfidence(input: MatchInput, eloStrengthDelta: number): number {
    const w = CONFIDENCE_WEIGHTS;

    const homeGP = input.homeGamesPlayed ?? 10;
    const awayGP = input.awayGamesPlayed ?? 10;
    const sampleScore = Math.min(100, ((homeGP + awayGP) / 40) * 100);
    const attackStability = sampleScore;

    const homeAvgC = input.homeAvgConceded ?? 1.2;
    const awayAvgC = input.awayAvgConceded ?? 1.2;
    const defensiveConsistency = Math.min(100, 100 - Math.abs(homeAvgC - awayAvgC) * 30);

    const homeRank = input.homeRank ?? 10;
    const awayRank = input.awayRank ?? 10;
    const rankGap = Math.abs(homeRank - awayRank);
    const marketStability = Math.min(100, 90 - rankGap * 2);

    const homePPG = input.homeFormPPG ?? 1.0;
    const awayPPG = input.awayFormPPG ?? 1.0;
    const formReliability = Math.min(100, 80 + (homePPG + awayPPG) * 5);

    // Elo strength: closer matches = more predictable for certain markets
    const eloStrength = Math.min(100, 90 - eloStrengthDelta * 0.15);

    const injuryStability = 75; // Neutral default

    const raw =
        w.ATTACK_STABILITY * attackStability +
        w.DEFENSIVE_CONSISTENCY * defensiveConsistency +
        w.MARKET_STABILITY * marketStability +
        w.FORM_RELIABILITY * formReliability +
        w.ELO_STRENGTH * eloStrength +
        w.INJURY_STABILITY * injuryStability;

    return Math.min(95, Math.max(40, Math.round(raw)));
}

// ============ WEIGHTED AVERAGES ============

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

function findOddsForMarket(
    odds: OddsEntry[],
    market: MarketDefinition,
    homeTeam: string,
    awayTeam: string,
): { bestOdds: number; bet365Odds: number | null; bestBookmaker: string; bookmakerCount: number } | null {
    if (odds.length === 0) return null;

    let filtered = odds.filter(o => market.sportmonksMarketIds.includes(o.market_id));
    if (filtered.length === 0) return null;

    // Debug: log what market 97 and 10 labels look like
    if ((market.sportmonksMarketIds.includes(97) || market.sportmonksMarketIds.includes(10)) && filtered.length > 0) {
        const sampleLabels = filtered.slice(0, 10).map(o => `"${o.label}" / name="${o.odds_name}" / odds=${o.odds_value}`);
        console.log(`[OddsDebug] Market ${market.sportmonksMarketIds} (${market.id}) for ${homeTeam} vs ${awayTeam}: ${sampleLabels.join(', ')}`);
    }

    if (market.sportmonksLabel) {
        const labelLower = market.sportmonksLabel.toLowerCase();
        const labelFiltered = filtered.filter(o => {
            const oLabel = o.label?.toLowerCase() || '';
            const oName = o.odds_name?.toLowerCase() || '';
            const combined = `${oLabel} ${oName}`;
            const parts = labelLower.split('&').map(s => s.trim());
            return parts.every(part => combined.includes(part));
        });
        if (labelFiltered.length > 0) filtered = labelFiltered;
        else return null;
    }

    if (market.sportmonksName) {
        const nameFiltered = filtered.filter(o =>
            o.odds_name === market.sportmonksName ||
            o.label?.includes(market.sportmonksName!)
        );
        if (nameFiltered.length > 0) filtered = nameFiltered;
        else return null;
    }

    if (market.isTeamSpecific && market.teamSide) {
        const teamName = market.teamSide === 'home' ? homeTeam : awayTeam;
        const teamPrefix = teamName.toLowerCase().substring(0, 5);
        const teamFiltered = filtered.filter(o =>
            o.label?.toLowerCase().includes(teamPrefix) ||
            o.odds_name?.toLowerCase().includes(teamPrefix)
        );
        if (teamFiltered.length > 0) filtered = teamFiltered;
    }

    if (filtered.length === 0) return null;

    // Count unique bookmakers for liquidity scoring
    const uniqueBookmakers = new Set(filtered.map(o => o.bookmaker_id));
    const bookmakerCount = uniqueBookmakers.size;

    const sorted = [...filtered].sort((a, b) => b.odds_value - a.odds_value);
    const best = sorted[0];
    const bet365 = sorted.find(o => o.bookmaker_id === 2);

    return {
        bestOdds: best.odds_value,
        bet365Odds: bet365?.odds_value ?? null,
        bestBookmaker: best.bookmaker_name,
        bookmakerCount,
    };
}

// ============ MAIN ENGINE PIPELINE ============

/**
 * Process a single match through the full Edge Engine pipeline.
 * Returns the ONE best bet for this match (highest Edge Score that passes all gates),
 * or null if no qualifying bet exists.
 */
export function processMatch(
    input: MatchInput,
    odds: OddsEntry[],
): { best: EvaluatedMarket | null; lambdaHome: number; lambdaAway: number; confidence: number; simulation: SimulationResult | null } {
    // STEP 1: Blend stats
    const homeBlend = blendStats(
        input.homeAvgScored, input.homeAvgConceded,
        input.homeFormScored, input.homeFormConceded
    );
    const awayBlend = blendStats(
        input.awayAvgScored, input.awayAvgConceded,
        input.awayFormScored, input.awayFormConceded
    );

    // STEP 2: Elo ratings
    const elo = computeEloRatings(
        input.homeRank ?? 10, input.awayRank ?? 10,
        input.homeGamesPlayed ?? 10, input.awayGamesPlayed ?? 10,
        input.homeFormPPG ?? 1.0, input.awayFormPPG ?? 1.0,
    );

    // STEP 3: Compute strength + lambdas
    const strength = calculateStrength(
        homeBlend.avgScored, homeBlend.avgConceded,
        awayBlend.avgScored, awayBlend.avgConceded,
    );

    const homeAdvantage = getLeagueHomeAdvantage(input.leagueId);
    let { lambdaHome, lambdaAway } = computeLambdas(strength, undefined, undefined, homeAdvantage);

    // STEP 4: Elo adjustment on lambdas
    const eloAdjusted = adjustLambdasWithElo(lambdaHome, lambdaAway, elo);
    lambdaHome = eloAdjusted.lambdaHome;
    lambdaAway = eloAdjusted.lambdaAway;

    // STEP 5: Fatigue + injury adjustments
    lambdaHome = applyFatigueAdjustment(lambdaHome, input.homeDaysRest);
    lambdaAway = applyFatigueAdjustment(lambdaAway, input.awayDaysRest);
    lambdaHome = applyInjuryWeight(lambdaHome, input.homeInjuryFactor);
    lambdaAway = applyInjuryWeight(lambdaAway, input.awayInjuryFactor);

    // Clamp final lambdas
    lambdaHome = Math.max(0.3, Math.min(4.0, lambdaHome));
    lambdaAway = Math.max(0.2, Math.min(3.5, lambdaAway));

    // STEP 6: Bayesian update on form
    // Adjust lambdas slightly based on Bayesian form evidence
    const homeFormSignal = (input.homeFormPPG ?? 1.0) / 3.0; // Normalize PPG to 0-1
    const awayFormSignal = (input.awayFormPPG ?? 1.0) / 3.0;
    const homeBayes = bayesianUpdate(lambdaHome / 4.0, homeFormSignal, input.homeGamesPlayed ?? 10);
    const awayBayes = bayesianUpdate(lambdaAway / 3.5, awayFormSignal, input.awayGamesPlayed ?? 10);
    lambdaHome = homeBayes.adjustedProbability * 4.0;
    lambdaAway = awayBayes.adjustedProbability * 3.5;

    // Re-clamp
    lambdaHome = Math.max(0.3, Math.min(4.0, lambdaHome));
    lambdaAway = Math.max(0.2, Math.min(3.5, lambdaAway));

    // STEP 7: Build Poisson score matrix
    const scoreMatrix = buildScoreMatrix(lambdaHome, lambdaAway);
    const poissonProbs = deriveMarketProbabilities(scoreMatrix);

    // STEP 8: Monte Carlo simulation
    const simulation = runMonteCarloSimulation(lambdaHome, lambdaAway, input.fixtureId);

    // STEP 9: Confidence model (now includes Elo)
    const confidence = calculateConfidence(input, elo.strengthDelta);

    // STEP 10: Evaluate all markets with blended probabilities
    const candidates: EvaluatedMarket[] = [];

    // === DIAGNOSTIC LOGGING (temporary) ===
    const diagnostics: string[] = [];
    diagnostics.push(`\n[Engine] ====== ${input.homeTeam} vs ${input.awayTeam} (${input.leagueId}) ======`);
    diagnostics.push(`[Engine] λ_home=${lambdaHome.toFixed(3)}, λ_away=${lambdaAway.toFixed(3)}, confidence=${confidence}`);
    diagnostics.push(`[Engine] Total odds entries: ${odds.length}`);

    // Log available market IDs in odds data
    const availableMarketIds = [...new Set(odds.map(o => o.market_id))];
    diagnostics.push(`[Engine] Available market IDs in odds: [${availableMarketIds.join(', ')}]`);

    for (const market of MARKET_WHITELIST) {
        let probability: number;

        if (market.probKey === null) {
            continue; // No probability key means skip
        }

        // Get Poisson probability
        const poissonProb = poissonProbs[market.probKey] as number;
        if (typeof poissonProb !== 'number' || poissonProb <= 0) {
            diagnostics.push(`[Engine] ${market.id}: SKIP — no poisson prob (${poissonProb})`);
            continue;
        }

        // Get MC probability if available
        const mcKey = market.probKey.replace(/_/g, '_');
        const mcProbs = simulation.marketProbabilities as Record<string, number>;
        const mcProb = mcProbs[mcKey] ?? poissonProb;

        // Blend: 40% Poisson + 60% Monte Carlo
        probability = blendProbabilities(poissonProb, mcProb);

        // Calibrate: correct systematic Poisson bias per market type
        const calibration = getCalibrationFactor(market.id);
        probability = Math.min(0.95, Math.max(0.01, probability * calibration));

        // Find odds
        const oddsData = findOddsForMarket(odds, market, input.homeTeam, input.awayTeam);
        if (!oddsData) {
            diagnostics.push(`[Engine] ${market.id}: SKIP — no odds matched`);
            continue;
        }

        diagnostics.push(`[Engine] ${market.id}: odds=${oddsData.bestOdds.toFixed(2)}, prob=${(probability * 100).toFixed(1)}%, books=${oddsData.bookmakerCount}`);

        // Evaluate (no longer rejects negative edge)
        const evaluated = evaluateMarket(
            market, probability, oddsData.bestOdds,
            oddsData.bet365Odds, oddsData.bestBookmaker,
            confidence, input.homeTeam, input.awayTeam,
            oddsData.bookmakerCount,
        );
        if (!evaluated) {
            diagnostics.push(`[Engine]   → SKIP (no evaluation produced)`);
            continue;
        }

        // CI from simulation
        const ciKey = mcKey;
        const ci = simulation.confidenceIntervals[ciKey] ?? [probability - 0.05, probability + 0.05];
        evaluated.confidenceInterval = ci;

        // Simulation win frequency
        evaluated.simulationWinFreq = Math.round(mcProb * simulation.simulationCount);

        // CLV Projection
        const clv = predictCLV(
            evaluated.odds, evaluated.probability,
            evaluated.edge, oddsData.bookmakerCount
        );
        evaluated.clvProjection = clv;

        // Risk Assessment (no longer a gate — just enriches data)
        const risk = assessRisk(
            evaluated.ev, evaluated.odds,
            ci, simulation.volatilityScore,
            oddsData.bookmakerCount, evaluated.varianceMultiplier,
        );
        evaluated.riskAssessment = risk;
        if (risk.isApproved) {
            evaluated.evAdjusted = risk.varianceAdjustedEV;
        }

        // Edge Score
        const edgeResult = computeEdgeScore(
            evaluated.evAdjusted, evaluated.edge,
            clv, risk, confidence,
            evaluated.probability, evaluated.odds,
        );
        evaluated.edgeScore = edgeResult.edgeScore;
        evaluated.riskTier = edgeResult.riskTier;
        evaluated.suggestedStake = edgeResult.suggestedStake;

        diagnostics.push(`[Engine]   → SCORED: edgeScore=${edgeResult.edgeScore}, tier=${edgeResult.riskTier}, ev=${(evaluated.ev * 100).toFixed(1)}%`);
        candidates.push(evaluated);
    }

    // STEP 11: Select ONE best bet — highest Edge Score with odds >= ODDS_DISPLAY_MIN
    const sorted = candidates
        .filter(c => {
            if (c.odds < ENGINE_CONFIG.ODDS_DISPLAY_MIN) {
                diagnostics.push(`[Engine] Display floor rejected ${c.marketId}: odds ${c.odds.toFixed(2)} < ${ENGINE_CONFIG.ODDS_DISPLAY_MIN}`);
                return false;
            }
            return true;
        })
        .sort((a, b) => b.edgeScore - a.edgeScore);

    const best = sorted[0] ?? null;
    diagnostics.push(`[Engine] Candidates: ${candidates.length}, Displayable: ${sorted.length}, Selected: ${best?.marketId || 'NONE'} (${best?.label || 'N/A'})`);
    diagnostics.push(`[Engine] ====== END ======\n`);

    // Print diagnostics
    console.log(diagnostics.join('\n'));

    return { best, lambdaHome, lambdaAway, confidence, simulation };
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
    simulation?: SimulationResult | null,
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
        market: market.label,
        marketId: market.marketId,
        probability: market.probability,
        impliedProbability: market.impliedProbability,
        odds: market.odds,
        bet365Odds: market.bet365Odds,
        bestBookmaker: market.bestBookmaker,
        edge: market.edge,
        ev: market.ev,
        evAdjusted: market.evAdjusted,
        confidence: market.confidence,
        edgeScore: market.edgeScore,
        riskTier: market.riskTier,
        suggestedStake: market.suggestedStake,
        clvProjection: market.clvProjection?.clvPercent ?? 0,
        simulationWinFreq: market.simulationWinFreq,
        confidenceInterval: market.confidenceInterval,
        lambdaHome,
        lambdaAway,
        isLocked,
        checksum,
        goalDistribution: simulation?.goalDistribution,
        scorelines: simulation?.scorelines,
    };
}

/**
 * Publish a prediction to immutable history.
 */
export async function publishPrediction(prediction: MatchPrediction): Promise<string | null> {
    try {
        const exists = await PredictionHistory.exists(prediction.fixtureId);
        if (exists) return null;

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
            tier: prediction.riskTier === 'A+' ? 'elite' : 'safe',
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
