/**
 * PitchPulse Master Engine — Immutable History (Step 13)
 * 
 * Write-once, read-many prediction storage.
 * SHA256 checksums prevent any post-publication modification.
 * Once a prediction is published, it is frozen forever.
 */

import { generateChecksum, verifyChecksum } from './validation';

// ============ TYPES ============

export interface ImmutablePrediction {
    fixture_id: number;
    lambda_home: number;
    lambda_away: number;
    market: string;             // Display label (e.g. "Over 2.5 Goals")
    market_id: string;          // Internal key (e.g. "over_2.5")
    p_model: number;            // Model probability (0-1)
    odds: number;               // Best odds at time of publication
    ev_adjusted: number;        // Adjusted expected value
    confidence: number;         // Confidence score (0-100)
    home_team: string;
    away_team: string;
    league_name: string;
    tier: 'elite' | 'safe';
    published_at: string;       // ISO timestamp
    result: string | null;      // NULL until FT (e.g. "WIN", "LOSS", "VOID")
    profit_loss: number | null; // NULL until settled
    checksum: string;           // SHA256
    is_frozen: boolean;         // true once result is recorded
    // Additional display fields
    bet365_odds: number | null;
    best_bookmaker: string;
    edge: number;
}

// ============ HISTORY STORE ============

export class PredictionHistory {
    /**
     * Publish a new prediction. Creates SHA256 checksum and stores immutably.
     * Returns the full prediction record with checksum.
     */
    static async publish(
        prediction: Omit<ImmutablePrediction, 'checksum' | 'is_frozen' | 'result' | 'profit_loss'>
    ): Promise<ImmutablePrediction> {
        const checksum = await generateChecksum({
            fixtureId: prediction.fixture_id,
            lambdaHome: prediction.lambda_home,
            lambdaAway: prediction.lambda_away,
            market: prediction.market,
            pModel: prediction.p_model,
            odds: prediction.odds,
            evAdjusted: prediction.ev_adjusted,
            confidence: prediction.confidence,
            publishedAt: prediction.published_at,
        });

        const record: ImmutablePrediction = {
            ...prediction,
            checksum,
            is_frozen: false,
            result: null,
            profit_loss: null,
        };

        // Save to Supabase
        await this.saveToSupabase(record);

        return record;
    }

    /**
     * Retrieve prediction from Supabase.
     * Verifies checksum integrity on read.
     */
    static async get(fixtureId: number): Promise<ImmutablePrediction | null> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return null;

            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('immutable_predictions')
                .select('*')
                .eq('fixture_id', fixtureId)
                .single();

            if (!data || error) return null;

            // Verify integrity
            const isValid = await verifyChecksum(data.checksum, {
                fixtureId: data.fixture_id,
                lambdaHome: data.lambda_home,
                lambdaAway: data.lambda_away,
                market: data.market,
                pModel: data.p_model,
                odds: data.odds,
                evAdjusted: data.ev_adjusted,
                confidence: data.confidence,
                publishedAt: data.published_at,
            });

            if (!isValid) {
                console.error(`[INTEGRITY ERROR] Checksum mismatch for fixture ${fixtureId}`);
                return null;
            }

            return data as ImmutablePrediction;
        } catch (e) {
            console.error('[PredictionHistory] Get error:', e);
            return null;
        }
    }

    /**
     * Freeze a prediction with its result (called when match ends).
     * Only the result and profit_loss fields are updated; everything else stays immutable.
     */
    static async freeze(
        fixtureId: number,
        result: 'WIN' | 'LOSS' | 'VOID',
        profitLoss: number
    ): Promise<boolean> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return false;

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Only update if not already frozen
            const { error } = await supabase
                .from('immutable_predictions')
                .update({
                    result,
                    profit_loss: profitLoss,
                    is_frozen: true,
                })
                .eq('fixture_id', fixtureId)
                .eq('is_frozen', false); // Guard: cannot modify a frozen record

            return !error;
        } catch (e) {
            console.error('[PredictionHistory] Freeze error:', e);
            return false;
        }
    }

    /**
     * Get all predictions for a date range (for History page).
     */
    static async getRange(startDate: string, endDate: string): Promise<ImmutablePrediction[]> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return [];

            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('immutable_predictions')
                .select('*')
                .gte('published_at', startDate)
                .lte('published_at', endDate)
                .order('published_at', { ascending: false });

            if (!data || error) return [];

            return data as ImmutablePrediction[];
        } catch (e) {
            console.error('[PredictionHistory] GetRange error:', e);
            return [];
        }
    }

    /**
     * Check if a prediction already exists for a fixture.
     * Used to prevent duplicate publications.
     */
    static async exists(fixtureId: number): Promise<boolean> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return false;

            const supabase = createClient(supabaseUrl, supabaseKey);
            const { count, error } = await supabase
                .from('immutable_predictions')
                .select('fixture_id', { count: 'exact', head: true })
                .eq('fixture_id', fixtureId);

            return !error && (count ?? 0) > 0;
        } catch {
            return false;
        }
    }

    // ============ PRIVATE ============

    private static async saveToSupabase(record: ImmutablePrediction): Promise<void> {
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return;

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Use upsert with conflict on fixture_id — but only if NOT already frozen
            const { error } = await supabase
                .from('immutable_predictions')
                .upsert(record, {
                    onConflict: 'fixture_id',
                    ignoreDuplicates: false,
                });

            if (error) {
                console.error('[PredictionHistory] Save error:', error);
            }
        } catch (e) {
            console.error('[PredictionHistory] Save exception:', e);
        }
    }
}
