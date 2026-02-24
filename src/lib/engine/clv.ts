/**
 * PitchPulse Edge Engine — Closing Line Value (CLV) Prediction Module
 * 
 * Forecasts expected closing odds based on model edge and market dynamics.
 * CLV is the single best predictor of long-term betting profitability.
 * 
 * Without real-time line history data, this module uses model-based estimation:
 *   - Edge magnitude → line shortening prediction
 *   - Model probability → fair odds estimation
 *   - Liquidity heuristic → price stability estimate
 */

// ============ TYPES ============

export interface CLVProjection {
    currentOdds: number;
    predictedClosingOdds: number;
    clvPercent: number;            // Expected CLV advantage %
    clvScore: number;              // 0-100 composite score
    lineDirection: 'shortening' | 'drifting' | 'stable';
    fairOdds: number;              // Model-implied fair odds
}

// ============ CLV PREDICTION ============

/**
 * Predict Closing Line Value based on model edge and market conditions.
 * 
 * Core logic:
 *   1. Fair odds = 1 / model_probability (no margin)
 *   2. If current odds > fair odds → line will shorten (positive CLV)
 *   3. CLV% ≈ (current_odds - predicted_close) / predicted_close × 100
 *   4. Predicted close uses a convergence model toward true probability
 * 
 * @param currentOdds     - Current best available odds
 * @param modelProbability - Our computed true probability
 * @param edge            - Model probability - implied probability
 * @param bookmakerCount  - Number of bookmakers offering this market
 */
export function predictCLV(
    currentOdds: number,
    modelProbability: number,
    edge: number,
    bookmakerCount: number,
): CLVProjection {
    // Fair odds from model (no vig)
    const fairOdds = 1 / modelProbability;

    // Market efficiency factor — more bookmakers = faster convergence to true odds
    const liquidityFactor = Math.min(1.0, bookmakerCount / 7);

    // Convergence rate: how much the line will move toward fair value
    // Higher liquidity → more convergence → more CLV captured
    const convergenceRate = 0.4 + liquidityFactor * 0.3; // 0.4–0.7

    // Predicted closing odds: current odds converge toward fair odds
    const predictedClosingOdds = currentOdds - (currentOdds - fairOdds) * convergenceRate;

    // CLV %: how much better we got vs predicted close
    const clvPercent = ((currentOdds - predictedClosingOdds) / predictedClosingOdds) * 100;

    // Line direction
    let lineDirection: CLVProjection['lineDirection'];
    if (edge > 0.06) {
        lineDirection = 'shortening';
    } else if (edge < 0.02) {
        lineDirection = 'drifting';
    } else {
        lineDirection = 'stable';
    }

    // CLV Score (0-100): composite of edge magnitude, liquidity, convergence
    const edgeContribution = Math.min(50, edge * 500);       // 10% edge → 50 points
    const liquidityContribution = liquidityFactor * 30;       // Full liquidity → 30 points
    const clvContribution = Math.min(20, clvPercent * 5);     // 4% CLV → 20 points
    const clvScore = Math.min(100, Math.round(
        edgeContribution + liquidityContribution + clvContribution
    ));

    return {
        currentOdds,
        predictedClosingOdds: Math.round(predictedClosingOdds * 100) / 100,
        clvPercent: Math.round(clvPercent * 100) / 100,
        clvScore,
        lineDirection,
        fairOdds: Math.round(fairOdds * 100) / 100,
    };
}
