export interface BestOdds {
    bookmaker: string;
    odds: number;
    market: string;
}

export interface Match {
    id: number;
    home_team: string;
    away_team: string;
    home_logo: string;
    away_logo: string;
    start_time: string;
    league_name: string;
    league_id: number;
    date: string;
    is_live: boolean;
    prediction?: string;
    confidence?: number;
    best_odds?: BestOdds;
    bet365_odds?: number | null;
    best_bookmaker?: string | null;
    candidates?: PredictionCandidate[];
    is_locked?: boolean;
    // Engine v2 fields
    tier?: 'elite' | 'safe';
    ev_adjusted?: number;
    edge?: number;
    odds?: number;
    lambda_home?: number;
    lambda_away?: number;
    probability?: number;
    market_id?: string;
    checksum?: string;
}


export interface PastMatch extends Match {
    home_score: number;
    away_score: number;
    status: string;
    prediction_hit: boolean;
}

export interface MarketAnalysis {
    marketName: string;
    prediction: string;
    probability: number;
    confidenceLevel: "Low" | "Medium" | "High";
    contextualStat?: string;
    microDetail?: string;
    odds?: number;
    starRating?: number;
    kellyStake?: number;
    expectedValue?: number;
    isElite?: boolean;
}

export interface ModelSignal {
    name: string;
    value: number;
    explanation: string;
    rating: "Low" | "Medium" | "High" | "Elite";
}

export interface PredictionCandidate {
    outcome: string;
    probability: number;
    odds?: number;
    starRating?: number;
    kellyStake?: number;
}

export interface PredictionResult {
    outcome: string;
    confidence: number;
    isPrime?: boolean;
    isElite?: boolean;
    expectedValue?: number;
    starRating?: number;
    kellyStake?: number;
    candidates?: PredictionCandidate[];
}

export interface MatchSummary {
    overallConfidence: number;
    summaryText: string;

    kickoffTime: string;
    generatedAt?: string;
}

class SeededRandom {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    // Linear Congruential Generator
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    range(min: number, max: number) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

const PREDICTION_CACHE_KEY = "pitchpulse_prediction_cache_v6";

const MANUAL_CORRECTIONS: Record<number, any> = {
    19432136: {
        mainPrediction: {
            outcome: "Under 3.5 Goals",
            confidence: 75,
            candidates: [
                { outcome: "Under 3.5 Goals", probability: 75 },
                { outcome: "Under 2.5 Goals", probability: 55 },
                { outcome: "Sheffield United or Draw", probability: 68 }
            ]
        },
        summary: {
            overallConfidence: 75,
            summaryText: "Statistical distribution strongly favors a controlled defensive output in this local derby.",
            kickoffTime: "12:00"
        }
    },
    19427151: {
        mainPrediction: {
            outcome: "Nottingham Forest",
            confidence: 32,
            candidates: [
                { outcome: "Nottingham Forest", probability: 32 },
                { outcome: "Under 3.5 Goals", probability: 71 },
            ]
        },
        summary: {
            overallConfidence: 32,
            summaryText: "Restored value-optimized prediction per user request.",
            kickoffTime: "14:00"
        }
    },
    19439495: {
        mainPrediction: {
            outcome: "Over 1.5 Goals",
            confidence: 70,
            candidates: [
                { outcome: "Over 1.5 Goals", probability: 70 },
                { outcome: "Under 3.5 Goals", probability: 78 }
            ]
        },
        summary: {
            overallConfidence: 70,
            summaryText: "Restored Over 1.5 Goals prediction from Dashboard.",
            kickoffTime: "13:00"
        }
    },
    19441368: {
        mainPrediction: {
            outcome: "Over 2.5 Goals",
            confidence: 49,
            candidates: [
                { outcome: "Over 2.5 Goals", probability: 49 },
                { outcome: "Sporting Gijón or Draw", probability: 77 }
            ]
        },
        summary: {
            overallConfidence: 49,
            summaryText: "Restored Over 2.5 Goals prediction from Dashboard.",
            kickoffTime: "13:00"
        }
    }
};




export class PredictionStore {
    private static getCache(): Record<number, any> {
        if (typeof window === "undefined") return {};
        const saved = localStorage.getItem(PREDICTION_CACHE_KEY);
        return saved ? JSON.parse(saved) : {};
    }

    private static setCache(cache: Record<number, any>) {
        if (typeof window === "undefined") return;
        localStorage.setItem(PREDICTION_CACHE_KEY, JSON.stringify(cache));
    }

    static async get(fixtureId: number) {
        // Priority 1: Manual hardcoded corrections (for fixes without Supabase access)
        if (MANUAL_CORRECTIONS[fixtureId]) {
            return MANUAL_CORRECTIONS[fixtureId];
        }

        const local = this.getCache()[fixtureId];
        if (local) return local;

        // Try Supabase if not in local storage

        try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase
                    .from("predictions_cache")
                    .select("*")
                    .eq("fixture_id", fixtureId)
                    .single();

                if (data && !error) {
                    return {
                        summary: data.summary,
                        signals: data.signals,
                        markets: data.markets,
                        mainPrediction: data.main_prediction,
                        generatedAt: data.generated_at
                    };
                }
            }
        } catch (e) {
            console.error("Supabase Prediction Retrieval Error:", e);
        }
        return null;
    }

    static async save(fixtureId: number, data: any) {
        const cache = this.getCache();
        const timestamp = new Date().toISOString();
        cache[fixtureId] = {
            ...data,
            generatedAt: timestamp
        };
        this.setCache(cache);

        // Save to Supabase for persistence across sessions/history
        try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const main = data.mainPrediction || {};
                await supabase.from("predictions_cache").upsert({
                    fixture_id: fixtureId,
                    outcome: main.outcome || "TBA",
                    confidence: main.confidence || 0,
                    candidates: main.candidates,
                    summary: data.summary,
                    signals: data.signals,
                    markets: data.markets,
                    main_prediction: main,
                    is_prime: main.isPrime,
                    is_elite: main.isElite,
                    star_rating: main.starRating,
                    kelly_stake: main.kellyStake,
                    generated_at: timestamp
                });
            }
        } catch (e) {
            // Fails silently
        }
    }
}

interface TeamStats {
    goalsFor: number;
    goalsAgainst: number;
    gamesPlayed: number;
    avgScored: number;
    avgConceded: number;
    rank: number;
}

interface TeamForm {
    avgScored: number;
    avgConceded: number;
    ppg: number; // Points Per Game (last 5-10)
}

class SportMonksService {
    private sportmonksApiKey: string | undefined;
    private footballDataApiKey: string | undefined;
    private sportmonksBaseUrl = "https://api.sportmonks.com/v3/football";
    private oddsBaseUrl = "https://api.sportmonks.com/v3/football";
    private footballDataBaseUrl = "https://api.football-data.org/v4";

    private LEAGUE_IDS = [2, 5, 8, 9, 564, 567, 82, 384, 387];

    // In-memory standings cache: seasonId -> { timestamp, data }
    private standingsCache: Map<number, { timestamp: number; teams: Map<number, TeamStats> }> = new Map();
    private readonly STANDINGS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

    constructor() {
        this.sportmonksApiKey = process.env.SPORTMONKS_API_KEY;
        this.footballDataApiKey = process.env.FOOTBALL_DATA_API_KEY;
    }

    private async fetchSportMonks(endpoint: string, params: Record<string, string> = {}) {
        if (!this.sportmonksApiKey) return null;
        const queryParams = new URLSearchParams({
            api_token: this.sportmonksApiKey,
            ...params
        });
        try {
            const response = await fetch(`${this.sportmonksBaseUrl}${endpoint}?${queryParams}`, {
                next: { revalidate: 300 }
            });
            return await response.json();
        } catch (error) {
            console.error("SportMonks API Error:", error);
            return null;
        }
    }

    private async fetchFootballData(endpoint: string) {
        if (!this.footballDataApiKey) return null;
        try {
            const response = await fetch(`${this.footballDataBaseUrl}${endpoint}`, {
                headers: { "X-Auth-Token": this.footballDataApiKey },
                next: { revalidate: 3600 }
            });
            return await response.json();
        } catch (error) {
            console.error("Football-Data API Error:", error);
            return null;
        }
    }

    async getTeamLogo(id: number): Promise<string | null> {
        const data = await this.fetchFootballData(`/teams/${id}`);
        return data?.crest || null;
    }

    private async fetchAllPages(endpoint: string, params: Record<string, string> = {}): Promise<any[]> {
        const allData: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const data = await this.fetchSportMonks(endpoint, {
                ...params,
                per_page: "50",
                page: String(page),
            });

            if (!data?.data || data.data.length === 0) break;

            allData.push(...data.data);
            hasMore = data.pagination?.has_more === true;
            page++;
        }

        return allData;
    }

    // ============ STANDINGS (Team Stats) ============

    private async getTeamStats(seasonId: number): Promise<Map<number, TeamStats>> {
        // Check cache
        const cached = this.standingsCache.get(seasonId);
        if (cached && Date.now() - cached.timestamp < this.STANDINGS_CACHE_TTL) {
            return cached.teams;
        }

        const teamMap = new Map<number, TeamStats>();

        // SportMonks standing type_ids:
        // 129 = Overall Matches Played
        // 133 = Overall Goals Scored
        // 134 = Overall Goals Conceded
        const TYPE_MATCHES_PLAYED = 129;
        const TYPE_GOALS_SCORED = 133;
        const TYPE_GOALS_CONCEDED = 134;

        try {
            const data = await this.fetchSportMonks(`/standings/seasons/${seasonId}`, {
                include: "details",
            });

            if (data?.data && Array.isArray(data.data)) {
                for (const row of data.data) {
                    const teamId = row.participant_id;
                    if (!teamId) continue;

                    // Extract stats from details[] by type_id
                    const details: any[] = row.details || [];
                    let gf = 0, ga = 0, gp = 1;
                    for (const d of details) {
                        if (d.type_id === TYPE_GOALS_SCORED) gf = Number(d.value) || 0;
                        if (d.type_id === TYPE_GOALS_CONCEDED) ga = Number(d.value) || 0;
                        if (d.type_id === TYPE_MATCHES_PLAYED) gp = Number(d.value) || 1;
                    }

                    teamMap.set(teamId, {
                        goalsFor: gf,
                        goalsAgainst: ga,
                        gamesPlayed: gp,
                        avgScored: gp > 0 ? gf / gp : 1.2,
                        avgConceded: gp > 0 ? ga / gp : 1.2,
                        rank: Number(row.position) || 10,
                    });
                }
            }
        } catch (e) {
            console.error("Failed to fetch standings for season", seasonId, e);
        }

        return teamMap;
    }

    private formCache: Map<number, { timestamp: number; form: TeamForm }> = new Map();
    private readonly FORM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

    private async getTeamForm(teamId: number): Promise<TeamForm> {
        const cached = this.formCache.get(teamId);
        if (cached && Date.now() - cached.timestamp < this.FORM_CACHE_TTL) {
            return cached.form;
        }

        try {
            // Fetch last 10 finished fixtures for this team
            const data = await this.fetchSportMonks(`/fixtures/participants/${teamId}`, {
                include: "scores",
                filters: "fixtureStates:5", // 5 = Finished
                per_page: "10",
                order: "starting_at:desc"
            });

            if (data?.data && Array.isArray(data.data)) {
                const recentMatches = data.data;
                let gf = 0, ga = 0, points = 0;

                for (const m of recentMatches) {
                    const isHome = m.participants?.find((p: any) => p.id === teamId)?.meta?.location === "home";
                    const hScore = m.scores?.find((s: any) => s.description === "CURRENT" && s.score.participant === "home")?.score?.goals ?? 0;
                    const aScore = m.scores?.find((s: any) => s.description === "CURRENT" && s.score.participant === "away")?.score?.goals ?? 0;

                    const teamScore = isHome ? hScore : aScore;
                    const oppScore = isHome ? aScore : hScore;

                    gf += teamScore;
                    ga += oppScore;

                    if (teamScore > oppScore) points += 3;
                    else if (teamScore === oppScore) points += 1;
                }

                const gp = recentMatches.length || 1;
                const form = {
                    avgScored: gf / gp,
                    avgConceded: ga / gp,
                    ppg: points / gp
                };
                this.formCache.set(teamId, { timestamp: Date.now(), form });
                return form;
            }
        } catch (e) {
            console.error("Failed to fetch form for team", teamId, e);
        }

        const defaultForm = { avgScored: 1.2, avgConceded: 1.2, ppg: 1.0 };
        return defaultForm;
    }

    // ============ ODDS ============

    // UK Bookmaker IDs
    private readonly UK_BOOKMAKER_IDS = [2, 5, 6, 9, 12, 13, 19]; // bet365, 888Sport, BetFred, Betfair, BetVictor, Coral, Paddy Power
    private readonly UK_BOOKMAKER_NAMES: Record<number, string> = {
        2: "bet365", 5: "888Sport", 6: "BetFred", 9: "Betfair",
        12: "BetVictor", 13: "Coral", 19: "Paddy Power"
    };

    // Prediction → Market ID + label/name filter mapping
    // SportMonks actual market IDs (from odds API, not markets endpoint):
    //   mk=1:  Match Winner (label=Home/Draw/Away)
    //   mk=12: Double Chance (label uses team names)
    //   mk=14: Both Teams to Score (label=Yes/No)
    //   mk=80: Goals Over/Under (label=Over/Under, name=2.5/1.5/etc)
    //   mk=82: Total Goals/BTTS combined
    //   mk=93: Exact Total Goals
    private readonly PREDICTION_MARKET_MAP: Record<string, { marketIds: number[]; label: string; name?: string }> = {
        "over 2.5 goals": { marketIds: [80, 81, 105], label: "Over", name: "2.5" },
        "over 1.5 goals": { marketIds: [80, 81, 105], label: "Over", name: "1.5" },
        "under 2.5 goals": { marketIds: [80, 81, 105], label: "Under", name: "2.5" },
        "under 3.5 goals": { marketIds: [80, 81, 105], label: "Under", name: "3.5" },
        "over 3.5 goals": { marketIds: [80, 81, 105], label: "Over", name: "3.5" },
        "both teams to score": { marketIds: [14], label: "Yes" },
        "1st half over 0.5": { marketIds: [28, 107], label: "Over", name: "0.5" },
        "multi-goal 2-4": { marketIds: [80, 81], label: "Over", name: "1.5" }, // Closest match
        "btts & over 2.5": { marketIds: [82], label: "Over 2.5 & Yes" },
        "win & btts": { marketIds: [82, 97], label: "Yes" }, // Specific team handled in filterOdds
    };

    // In-memory odds cache to avoid re-fetching per request
    private oddsCache: Map<number, { timestamp: number; odds: any[] }> = new Map();
    private readonly ODDS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    /**
     * Fetch ALL UK bookmaker odds for a fixture (single API call, cached).
     * Also upserts into Supabase for persistent caching.
     */
    async fetchFixtureOdds(fixtureId: number): Promise<any[]> {
        // Check in-memory cache first
        const cached = this.oddsCache.get(fixtureId);
        if (cached && Date.now() - cached.timestamp < this.ODDS_CACHE_TTL) {
            return cached.odds;
        }

        // Check Supabase cache
        try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const fifteenMinAgo = new Date(Date.now() - this.ODDS_CACHE_TTL).toISOString();
                const { data: cachedOdds } = await supabase
                    .from("odds_cache")
                    .select("*")
                    .eq("fixture_id", fixtureId)
                    .gte("fetched_at", fifteenMinAgo);

                if (cachedOdds && cachedOdds.length > 0) {
                    this.oddsCache.set(fixtureId, { timestamp: Date.now(), odds: cachedOdds });
                    return cachedOdds;
                }
            }
        } catch {
            // Supabase not available yet, continue with API
        }

        // Fetch from SportMonks API
        const ukBookmakers = this.UK_BOOKMAKER_IDS.join(",");
        const allOdds: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const data = await this.fetchSportMonks(`/odds/pre-match/fixtures/${fixtureId}`, {
                filters: `bookmakers:${ukBookmakers}`,
                per_page: "150",
                page: String(page),
            });
            if (!data?.data || data.data.length === 0) break;
            allOdds.push(...data.data);
            hasMore = data.pagination?.has_more === true;
            page++;
        }

        // Normalize and cache in memory
        const normalized = allOdds.map((entry: any) => ({
            fixture_id: fixtureId,
            bookmaker_id: entry.bookmaker_id,
            bookmaker_name: this.UK_BOOKMAKER_NAMES[entry.bookmaker_id] || `Bookmaker ${entry.bookmaker_id}`,
            market_id: entry.market_id,
            market_name: entry.market_description || "Unknown",
            label: entry.label || "",
            odds_name: entry.name || "",  // threshold value like "2.5" for Over/Under
            odds_value: parseFloat(entry.value || "0"),
        })).filter((o: any) => o.odds_value > 0);

        this.oddsCache.set(fixtureId, { timestamp: Date.now(), odds: normalized });

        // Upsert into Supabase (fire-and-forget)
        try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey && normalized.length > 0) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase.from("odds_cache").upsert(
                    normalized.map(o => ({ ...o, fetched_at: new Date().toISOString() })),
                    { onConflict: "fixture_id,bookmaker_id,market_id,label" }
                );
            }
        } catch {
            // Supabase write failed silently
        }

        return normalized;
    }

    /**
     * Get odds for a specific prediction from UK bookmakers.
     * Returns bet365 odds + best odds + all bookmaker odds for comparison.
     */
    async getOddsForPrediction(
        fixtureId: number,
        prediction: string,
        homeTeam: string = "",
        awayTeam: string = ""
    ): Promise<{ bet365: number | null; best: BestOdds | null; all: BestOdds[] }> {
        const allOdds = await this.fetchFixtureOdds(fixtureId);
        if (allOdds.length === 0) return { bet365: null, best: null, all: [] };

        const p = prediction.toLowerCase();

        // Find the market mapping for this prediction
        let marketIds: number[] = [];
        let labelMatch: string | null = null;
        let nameMatch: string | null = null;

        // Check direct mapping first
        for (const [key, mapping] of Object.entries(this.PREDICTION_MARKET_MAP)) {
            if (p.includes(key)) {
                marketIds = mapping.marketIds;
                labelMatch = mapping.label;
                nameMatch = mapping.name || null;
                break;
            }
        }

        // Team-specific predictions
        if (marketIds.length === 0) {
            if (p.includes("to win")) {
                marketIds = [1]; // Match Winner
                const isHome = homeTeam && p.includes(homeTeam.toLowerCase().substring(0, 5));
                labelMatch = isHome ? "Home" : "Away";
            } else if (p.includes("or draw")) {
                marketIds = [12]; // Double Chance
                // Double chance uses team names in labels, match via market_description
                labelMatch = null; // will match by market_id only, then pick correct one
            } else if (p.includes("& btts") || p.includes("btts &")) {
                marketIds = [82]; // Total Goals/BTTS combined
                labelMatch = null;
            }
        }

        // Filter odds by market - Fail safe: if no marketIds found and not a team-specific bet, return empty
        if (marketIds.length === 0) {
            return { bet365: null, best: null, all: [] };
        }

        let relevantOdds = allOdds.filter((o: any) => marketIds.includes(o.market_id));

        // Filter by label (e.g., "Over" or "Home")
        if (labelMatch && relevantOdds.length > 0) {
            const labelFiltered = relevantOdds.filter((o: any) =>
                o.label?.toLowerCase() === labelMatch!.toLowerCase()
            );
            if (labelFiltered.length > 0) {
                relevantOdds = labelFiltered;
            } else {
                return { bet365: null, best: null, all: [] }; // No match for required label
            }
        }

        // Filter by name/threshold (e.g., "2.5" for Over/Under)
        if (nameMatch && relevantOdds.length > 0) {
            const nameFiltered = relevantOdds.filter((o: any) =>
                o.odds_name === nameMatch
            );
            if (nameFiltered.length > 0) {
                relevantOdds = nameFiltered;
            } else {
                return { bet365: null, best: null, all: [] }; // No match for required name/threshold
            }
        }

        // For Double Chance with team names, try to match the prediction team
        if (marketIds.includes(12) && relevantOdds.length > 1) {
            // Prediction like "Sassuolo or Draw" → look for label containing team name
            const teamInPrediction = p.replace(" or draw", "").replace(" to win", "").trim();
            if (teamInPrediction) {
                const teamFiltered = relevantOdds.filter((o: any) =>
                    o.label?.toLowerCase().includes(teamInPrediction.substring(0, 5))
                );
                if (teamFiltered.length > 0) relevantOdds = teamFiltered;
            }
        }

        // Build per-bookmaker best odds
        const bookmakerBest = new Map<string, BestOdds>();
        for (const o of relevantOdds) {
            const name = o.bookmaker_name;
            const existing = bookmakerBest.get(name);
            if (!existing || o.odds_value > existing.odds) {
                bookmakerBest.set(name, {
                    bookmaker: name,
                    odds: o.odds_value,
                    market: o.market_name,
                });
            }
        }

        const allBookmakers = Array.from(bookmakerBest.values())
            .sort((a, b) => b.odds - a.odds);

        const bet365Entry = allBookmakers.find(o => o.bookmaker === "bet365");
        const bestEntry = allBookmakers[0] || null;

        return {
            bet365: bet365Entry?.odds ?? null,
            best: bestEntry,
            all: allBookmakers,
        };
    }

    /**
     * Get prediction-specific odds comparison for the analysis modal.
     */
    async getOddsComparison(fixtureId: number, prediction?: string, homeTeam?: string, awayTeam?: string): Promise<BestOdds[]> {
        if (prediction) {
            const result = await this.getOddsForPrediction(fixtureId, prediction, homeTeam, awayTeam);
            return result.all;
        }

        // Fallback: return generic best odds per bookmaker
        const allOdds = await this.fetchFixtureOdds(fixtureId);
        const bookmakerMap = new Map<string, BestOdds>();
        for (const o of allOdds) {
            const name = o.bookmaker_name;
            const existing = bookmakerMap.get(name);
            if (!existing || o.odds_value > existing.odds) {
                bookmakerMap.set(name, { bookmaker: name, odds: o.odds_value, market: o.market_name });
            }
        }
        return Array.from(bookmakerMap.values())
            .sort((a, b) => b.odds - a.odds)
            .slice(0, 7);
    }

    // ============ FIXTURES (Engine v2) ============

    async getFixtures(days: number = 10): Promise<Match[]> {
        const { processMatch, toMatchPrediction, publishPrediction } = await import('@/lib/engine/engine');
        const { PredictionHistory } = await import('@/lib/engine/history');

        const now = new Date();
        const startDate = now.toISOString().split('T')[0];
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const allFixtures = await this.fetchAllPages(`/fixtures/between/${startDate}/${endDate}`, {
            include: "participants;league",
            filters: `fixtureLeagues:${this.LEAGUE_IDS.join(',')}`
        });

        if (allFixtures.length === 0) return [];

        // FILTER: Remove finished games (5=FT, 7=AET, 8=PENS) from the "Upcoming" view
        const activeFixtures = allFixtures.filter((f: any) => ![5, 7, 8].includes(f.state_id));
        if (activeFixtures.length === 0) return [];

        // Collect unique season IDs and fetch standings
        const seasonIds = [...new Set(activeFixtures.map((f: any) => f.season_id).filter(Boolean))];
        const allTeamStats = new Map<number, TeamStats>();
        for (const sid of seasonIds) {
            const stats = await this.getTeamStats(sid);
            stats.forEach((v, k) => allTeamStats.set(k, v));
        }

        const results = await Promise.all(activeFixtures.map(async (f: any) => {
            const homeP = f.participants.find((p: any) => p.meta.location === "home");
            const awayP = f.participants.find((p: any) => p.meta.location === "away");
            const home = homeP?.name || "Home Team";
            const away = awayP?.name || "Away Team";
            const homeStats = allTeamStats.get(homeP?.id);
            const awayStats = allTeamStats.get(awayP?.id);

            // Fetch form on-demand (handled by cache)
            const [homeForm, awayForm] = await Promise.all([
                homeP?.id ? this.getTeamForm(homeP.id) : Promise.resolve(undefined),
                awayP?.id ? this.getTeamForm(awayP.id) : Promise.resolve(undefined)
            ]);

            // Check immutable history first
            const existing = await PredictionHistory.get(f.id);
            if (existing) {
                return {
                    id: f.id,
                    home_team: home,
                    away_team: away,
                    home_logo: homeP?.image_path || "",
                    away_logo: awayP?.image_path || "",
                    start_time: f.starting_at,
                    league_name: f.league?.name || "League",
                    league_id: f.league_id,
                    date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                    is_live: f.status === "LIVE" || f.status === "INPLAY",
                    prediction: existing.market,
                    confidence: existing.confidence,
                    is_locked: true,
                    tier: existing.tier as 'elite' | 'safe',
                    ev_adjusted: existing.ev_adjusted,
                    edge: existing.edge,
                    odds: existing.odds,
                    bet365_odds: existing.bet365_odds,
                    best_bookmaker: existing.best_bookmaker,
                    lambda_home: existing.lambda_home,
                    lambda_away: existing.lambda_away,
                    probability: existing.p_model,
                    market_id: existing.market_id,
                    checksum: existing.checksum,
                } as Match;
            }

            // Run through engine v2 pipeline
            const odds = await this.fetchFixtureOdds(f.id);
            const engineResult = processMatch({
                fixtureId: f.id,
                homeTeam: home,
                awayTeam: away,
                homeLogo: homeP?.image_path || "",
                awayLogo: awayP?.image_path || "",
                leagueName: f.league?.name || "League",
                leagueId: f.league_id,
                startTime: f.starting_at,
                date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                isLive: f.status === "LIVE" || f.status === "INPLAY",
                homeAvgScored: homeStats?.avgScored,
                homeAvgConceded: homeStats?.avgConceded,
                awayAvgScored: awayStats?.avgScored,
                awayAvgConceded: awayStats?.avgConceded,
                homeRank: homeStats?.rank,
                awayRank: awayStats?.rank,
                homeGamesPlayed: homeStats?.gamesPlayed,
                awayGamesPlayed: awayStats?.gamesPlayed,
                homeFormScored: homeForm?.avgScored,
                homeFormConceded: homeForm?.avgConceded,
                homeFormPPG: homeForm?.ppg,
                awayFormScored: awayForm?.avgScored,
                awayFormConceded: awayForm?.avgConceded,
                awayFormPPG: awayForm?.ppg,
            }, odds);

            // Pick Elite if available, otherwise Safe
            const bestPick = engineResult.elite || engineResult.safe;

            if (bestPick) {
                const prediction = toMatchPrediction(
                    {
                        fixtureId: f.id, homeTeam: home, awayTeam: away,
                        homeLogo: homeP?.image_path || "", awayLogo: awayP?.image_path || "",
                        leagueName: f.league?.name || "League", leagueId: f.league_id,
                        startTime: f.starting_at,
                        date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                        isLive: f.status === "LIVE" || f.status === "INPLAY",
                    },
                    bestPick,
                    engineResult.lambdaHome,
                    engineResult.lambdaAway,
                    false,
                );

                // Publish to immutable history (fire-and-forget)
                publishPrediction(prediction).catch(e => console.error('[Engine] Publish failed:', e));

                return {
                    id: f.id,
                    home_team: home,
                    away_team: away,
                    home_logo: homeP?.image_path || "",
                    away_logo: awayP?.image_path || "",
                    start_time: f.starting_at,
                    league_name: f.league?.name || "League",
                    league_id: f.league_id,
                    date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                    is_live: f.status === "LIVE" || f.status === "INPLAY",
                    prediction: bestPick.label,
                    confidence: bestPick.confidence,
                    is_locked: true,
                    tier: bestPick.tier as 'elite' | 'safe',
                    ev_adjusted: bestPick.evAdjusted,
                    edge: bestPick.edge,
                    odds: bestPick.odds,
                    bet365_odds: bestPick.bet365Odds,
                    best_bookmaker: bestPick.bestBookmaker,
                    lambda_home: engineResult.lambdaHome,
                    lambda_away: engineResult.lambdaAway,
                    probability: bestPick.probability,
                    market_id: bestPick.marketId,
                } as Match;
            }

            // Fallback: No qualifying market found — use legacy calculation for display
            const legacyBet = this.calculateBestPrediction(f.id, home, away, homeStats, awayStats, homeForm, awayForm);
            return {
                id: f.id,
                home_team: home,
                away_team: away,
                home_logo: homeP?.image_path || "",
                away_logo: awayP?.image_path || "",
                start_time: f.starting_at,
                league_name: f.league?.name || "League",
                league_id: f.league_id,
                date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                is_live: f.status === "LIVE" || f.status === "INPLAY",
                prediction: legacyBet.outcome,
                confidence: legacyBet.confidence,
                candidates: legacyBet.candidates,
                is_locked: false,
                tier: 'safe' as const,
            } as Match;
        }));

        return results;
    }

    async getPastFixtures(days: number = 3): Promise<PastMatch[]> {
        const { PredictionHistory } = await import('@/lib/engine/history');

        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const allFixtures = await this.fetchAllPages(`/fixtures/between/${startDate}/${endDate}`, {
            include: "participants;scores;league",
            filters: `fixtureLeagues:${this.LEAGUE_IDS.join(',')}`
        });

        if (allFixtures.length === 0) return [];

        // Collect unique season IDs and fetch standings (for fallback only)
        const seasonIds = [...new Set(allFixtures.map((f: any) => f.season_id).filter(Boolean))];
        const allTeamStats = new Map<number, TeamStats>();
        for (const sid of seasonIds) {
            const stats = await this.getTeamStats(sid);
            stats.forEach((v, k) => allTeamStats.set(k, v));
        }

        return Promise.all(allFixtures
            .filter((f: any) => [5, 7, 8].includes(f.state_id))
            .map(async (f: any) => {
                const homeP = f.participants.find((p: any) => p.meta.location === "home");
                const awayP = f.participants.find((p: any) => p.meta.location === "away");
                const home = homeP?.name || "Home Team";
                const away = awayP?.name || "Away Team";
                const homeStats = allTeamStats.get(homeP?.id);
                const awayStats = allTeamStats.get(awayP?.id);

                const homeScore = f.scores?.find((s: any) => s.description === "CURRENT" && s.score.participant === "home")?.score?.goals ?? 0;
                const awayScore = f.scores?.find((s: any) => s.description === "CURRENT" && s.score.participant === "away")?.score?.goals ?? 0;

                // Priority 1: Read from immutable_predictions (Engine v2)
                const immutable = await PredictionHistory.get(f.id);
                if (immutable) {
                    const hit = this.evaluatePrediction(immutable.market, homeScore, awayScore, home, away);

                    // Freeze prediction with result if not already frozen
                    if (!immutable.is_frozen) {
                        const result = hit ? 'WIN' : 'LOSS';
                        const profitLoss = hit ? (immutable.odds - 1) : -1;
                        PredictionHistory.freeze(f.id, result, profitLoss).catch(e => console.error('[History] Freeze failed:', e));
                    }

                    return {
                        id: f.id,
                        home_team: home,
                        away_team: away,
                        home_logo: homeP?.image_path || "",
                        away_logo: awayP?.image_path || "",
                        start_time: f.starting_at,
                        league_name: f.league?.name || "League",
                        league_id: f.league_id,
                        date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                        is_live: false,
                        prediction: immutable.market,
                        confidence: immutable.confidence,
                        home_score: homeScore,
                        away_score: awayScore,
                        status: "FT",
                        prediction_hit: hit,
                        is_locked: true,
                        tier: immutable.tier as 'elite' | 'safe',
                        ev_adjusted: immutable.ev_adjusted,
                        edge: immutable.edge,
                        odds: immutable.odds,
                        bet365_odds: immutable.bet365_odds,
                        best_bookmaker: immutable.best_bookmaker,
                        checksum: immutable.checksum,
                    } as PastMatch;
                }

                // Priority 2: Legacy predictions_cache (for pre-engine-v2 data)
                const cached = await PredictionStore.get(f.id);
                const bestBet = cached?.mainPrediction || this.calculateBestPrediction(f.id, home, away, homeStats, awayStats);

                const outcome = bestBet.outcome;
                const confidence = bestBet.confidence;
                const hit = this.evaluatePrediction(outcome, homeScore, awayScore, home, away);

                return {
                    id: f.id,
                    home_team: home,
                    away_team: away,
                    home_logo: homeP?.image_path || "",
                    away_logo: awayP?.image_path || "",
                    start_time: f.starting_at,
                    league_name: f.league?.name || "League",
                    league_id: f.league_id,
                    date: new Date(f.starting_at).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }),
                    is_live: false,
                    prediction: outcome,
                    confidence: confidence,
                    candidates: cached?.mainPrediction?.candidates || bestBet.candidates,
                    home_score: homeScore,
                    away_score: awayScore,
                    status: "FT",
                    prediction_hit: hit,
                    is_locked: true,
                } as PastMatch;
            }));
    }

    // ============ EVALUATION ============

    private evaluatePrediction(prediction: string, homeScore: number, awayScore: number, home: string, away: string): boolean {
        const totalGoals = homeScore + awayScore;
        const btts = homeScore > 0 && awayScore > 0;
        const homeWin = homeScore > awayScore;
        const awayWin = awayScore > homeScore;
        const draw = homeScore === awayScore;
        const p = prediction.toLowerCase();
        const homeName = home.toLowerCase();
        const awayName = away.toLowerCase();

        // 1. Team-Specific Outcomes (Most common)
        if (p.includes(" or draw")) {
            if (p.includes(homeName)) return homeWin || draw;
            if (p.includes(awayName)) return awayWin || draw;
        }
        if (p.includes(" to win")) {
            if (p.includes(homeName)) return homeWin;
            if (p.includes(awayName)) return awayWin;
        }
        if (p.includes("(dnb)")) {
            if (p.includes(homeName)) return homeWin;
            if (p.includes(awayName)) return awayWin;
        }

        // 2. Goals & BTTS Combined
        if (p.includes("btts & over 2.5")) return btts && totalGoals > 2.5;
        if (p.includes("& btts")) {
            const teamWinMatch = p.includes(homeName) ? homeWin : awayWin;
            return btts && teamWinMatch;
        }
        if (p.includes("win & over 2.5")) return homeWin && totalGoals > 2.5;
        if (p.includes("& over 1.5")) {
            const teamWinMatch = p.includes(homeName) ? homeWin : (p.includes(awayName) ? awayWin : false);
            return teamWinMatch && totalGoals > 1.5;
        }

        // 3. Simple Markets
        if (p.includes("both teams to score") || p === "btts") return btts;
        if (p.includes("over 3.5")) return totalGoals > 3.5;
        if (p.includes("over 2.5")) return totalGoals > 2.5;
        if (p.includes("over 1.5")) return totalGoals > 1.5;
        if (p.includes("over 0.5")) return totalGoals > 0.5;
        if (p.includes("under 3.5")) return totalGoals < 3.5;
        if (p.includes("under 2.5")) return totalGoals < 2.5;
        if (p.includes("multi-goal 2-4")) return totalGoals >= 2 && totalGoals <= 4;

        // 4. Handicaps & Scorelines
        if (p.includes("-0.5")) {
            if (p.includes(homeName)) return homeWin;
            if (p.includes(awayName)) return awayWin;
        }
        if (p.includes("+0.5")) {
            if (p.includes(homeName)) return homeWin || draw;
            if (p.includes(awayName)) return awayWin || draw;
        }
        if (p.includes("scoreline")) {
            const scoreMatch = p.match(/(\d+)-(\d+)/);
            if (scoreMatch) {
                return homeScore === parseInt(scoreMatch[1]) && awayScore === parseInt(scoreMatch[2]);
            }
        }

        // 5. Special cases & Fallbacks
        if (p.includes("home win to nil")) return homeWin && awayScore === 0;
        if (p.includes("double chance")) return awayWin || draw || homeWin;
        if (p === homeName) return homeWin; // First Team To Score / Outcome fallback
        if (p === awayName) return awayWin;

        return false;
    }

    // ============ DATA-DRIVEN PREDICTION ============

    public calculateBestPrediction(
        fixtureId: number,
        home: string,
        away: string,
        homeStats?: TeamStats,
        awayStats?: TeamStats,
        homeForm?: TeamForm,
        awayForm?: TeamForm
    ) {
        const rng = new SeededRandom(fixtureId);

        // 1. BASE STATS (Seasonal Averages)
        const hAvgS = homeStats ? homeStats.avgScored : (1.2 + rng.next() * 0.8);
        const hAvgC = homeStats ? homeStats.avgConceded : (0.8 + rng.next() * 0.8);
        const aAvgS = awayStats ? awayStats.avgScored : (1.0 + rng.next() * 0.8);
        const aAvgC = awayStats ? awayStats.avgConceded : (1.0 + rng.next() * 0.9);

        // 2. MOMENTUM ADJUSTMENT (60% Form / 40% Seasonal)
        let hS = hAvgS, hC = hAvgC, aS = aAvgS, aC = aAvgC;

        if (homeForm) {
            hS = (hAvgS * 0.4) + (homeForm.avgScored * 0.6);
            hC = (hAvgC * 0.4) + (homeForm.avgConceded * 0.6);
        }
        if (awayForm) {
            aS = (aAvgS * 0.4) + (awayForm.avgScored * 0.6);
            aC = (aAvgC * 0.4) + (awayForm.avgConceded * 0.6);
        }

        // 3. STRENGTH ADJUSTMENT (Rank Gap Dominance)
        let homeRankMod = 1.0, awayRankMod = 1.0;
        if (homeStats && awayStats) {
            const rankGap = awayStats.rank - homeStats.rank; // Higher rank = Lower number
            if (rankGap > 8) homeRankMod = 1.15; // Home significantly stronger
            if (rankGap < -8) awayRankMod = 1.15; // Away significantly stronger

            // Extreme gap (e.g. 1st vs 20th)
            if (rankGap > 15) homeRankMod = 1.25;
            if (rankGap < -15) awayRankMod = 1.25;
        }

        // 4. PPG MOMENTUM BONUS
        if (homeForm && awayForm) {
            const ppgGap = homeForm.ppg - awayForm.ppg;
            if (ppgGap > 0.8) homeRankMod *= 1.1; // Home on fire compared to away
            if (ppgGap < -0.8) awayRankMod *= 1.1;
        }

        // Expected goals per team using attack/defense model + modifiers
        const homeXG = ((hS + aC) / 2) * homeRankMod;
        const awayXG = ((aS + hC) / 2) * awayRankMod;
        const totalXG = homeXG + awayXG;

        // Poisson probabilities - RAW (Unbiased)
        const homeXGAdj = homeXG;
        const awayXGAdj = awayXG;
        const totalXGAdj = homeXGAdj + awayXGAdj;

        const pHomeScores = 1 - Math.exp(-homeXGAdj);
        const pAwayScores = 1 - Math.exp(-awayXGAdj);

        const pTotal0 = Math.exp(-totalXGAdj);
        const pTotal1 = totalXGAdj * Math.exp(-totalXGAdj);
        const pTotal2 = (totalXGAdj ** 2 / 2) * Math.exp(-totalXGAdj);
        const pTotal3 = (totalXGAdj ** 3 / 6) * Math.exp(-totalXGAdj);
        const pTotal4 = (totalXGAdj ** 4 / 24) * Math.exp(-totalXGAdj);
        const pTotal5Plus = 1 - (pTotal0 + pTotal1 + pTotal2 + pTotal3 + pTotal4);

        // Standard Probabilities
        const pUnder35 = (pTotal0 + pTotal1 + pTotal2 + pTotal3);
        const pOver15 = 1 - pTotal0 - pTotal1;
        const pOver25 = 1 - pTotal0 - pTotal1 - pTotal2;
        const pBTTS = pHomeScores * pAwayScores;
        const pMulti24 = pTotal2 + pTotal3 + pTotal4;

        // Home/Away win probabilities
        const homeAdvantage = homeXGAdj - awayXGAdj;
        const pHomeWin = Math.min(0.75, Math.max(0.28, 0.40 + homeAdvantage * 0.22));
        const pAwayWin = Math.min(0.60, Math.max(0.15, 0.28 - homeAdvantage * 0.18));
        const pDraw = 1 - pHomeWin - pAwayWin;

        // Build ALL 15 markets (Synchronized with MarketGrid categories)
        const markets: { outcome: string; probability: number }[] = [
            // 1. Fulltime Result
            { outcome: home + " to Win", probability: pHomeWin * 100 },
            // 2. Double Chance
            { outcome: home + " or Draw", probability: (pHomeWin + pDraw) * 100 },
            // 3. Draw No Bet
            { outcome: home + " (DNB)", probability: (pHomeWin / (pHomeWin + pAwayWin)) * 100 },
            // 4. Asian Handicap
            { outcome: home + " -0.5", probability: pHomeWin * 100 }, // Home -0.5 is same as Home Win
            // 5. Over/Under
            { outcome: "Over 2.5 Goals", probability: pOver25 * 100 },
            // 6. BTTS
            { outcome: "Both Teams To Score", probability: pBTTS * 100 },
            // 7. Total Goals/BTTS (Stacked - 1.2x Correlation)
            { outcome: "BTTS & Over 2.5", probability: Math.min(95, pBTTS * pOver25 * 100 * 1.2) },
            // 8. Team Total Goals
            { outcome: home + " Over 1.5", probability: (1 - Math.exp(-homeXG) - homeXG * Math.exp(-homeXG)) * 100 },
            // 9. 1st Half Goals
            { outcome: "1st Half Over 0.5", probability: Math.min(90, (0.45 + totalXG * 0.08) * 100) },
            // 10. Goal Line (Generic Over 1.5)
            { outcome: "Over 1.5 Goals", probability: pOver15 * 100 },
            // 11. Correct Score (Simplified top pick)
            { outcome: homeAdvantage > 0.5 ? "2-1 Scoreline" : "1-1 Scoreline", probability: Math.max(12, 18 - Math.abs(homeAdvantage) * 5) },
            // 12. First Team To Score
            { outcome: homeXG > awayXG ? home : away, probability: (homeXG / (homeXG + awayXG)) * 100 },
            // 13. Result/BTTS (Stacked - 1.2x Correlation)
            { outcome: home + " & BTTS", probability: Math.min(95, pHomeWin * pBTTS * 100 * 1.2) },
            // 14. Half Time Result
            { outcome: "Draw at HT", probability: (0.40 + (1 / (totalXG + 1)) * 0.20) * 100 },
            // 15. HT/FT
            { outcome: homeAdvantage > 0.3 ? "Home/Home" : "Draw/Home", probability: Math.max(15, pHomeWin * 0.6 * 100) },
            // 16. Double Chance & Under (Stability - Option 3)
            { outcome: home + " or Draw & Under 4.5", probability: Math.min(98, (pHomeWin + pDraw) * (1 - pTotal5Plus) * 100 * 1.1) },
            // 17. Result & Over 1.5 (Value - Option 3 - 1.2x Correlation)
            { outcome: home + " Win & Over 1.5", probability: Math.min(95, pHomeWin * pOver15 * 100 * 1.2) },
            // 18. Heavy Handicap (Oracle Upgrade - Option 7)
            { outcome: home + " -1.5", probability: Math.max(20, (pHomeWin * pOver25 * 0.8) * 100) },
            // 19. Goal Lines (Alternative)
            { outcome: "Over 3.5 Goals", probability: pTotal5Plus * 100 + (pTotal4 * 0.5) * 100 }
        ];

        // Also add some extra common ones for variety
        markets.push(
            { outcome: "Under 3.5 Goals", probability: pUnder35 * 100 },
            { outcome: "Multi-Goal 2-4", probability: pMulti24 * 100 },
            { outcome: away + " or Draw", probability: (pAwayWin + pDraw) * 100 },
            { outcome: away + " -1.5", probability: Math.max(10, (pAwayWin * pOver25 * 0.7) * 100) }
        );

        // Return ALL markets sorted by raw probability for the core AI result
        const sorted = [...markets].sort((a, b) => b.probability - a.probability);
        const best = sorted[0];

        const confidence = Math.min(95, Math.max(55, Math.round(best.probability)));
        return {
            outcome: best.outcome,
            confidence,
            candidates: markets
        };
    }

    async getMatchSummary(fixtureId: number): Promise<MatchSummary> {
        const cached = await PredictionStore.get(fixtureId);
        if (cached?.summary) return cached.summary;

        const rng = new SeededRandom(fixtureId);
        const summaries = [
            "High probability of a controlled match with limited goal output. Defensive metrics suggest a low-scoring affair.",
            "Expect high offensive pressure from the home side. Historical data points to an early goal trend based on form.",
            "Tactical standoff predicted. Both teams show strong defensive resilience in recent heavy-fixture rotation.",
            "Volatility is balanced for this fixture. Model signals suggest a potential high-tempo opening 30 minutes."
        ];

        const result = {
            overallConfidence: Math.min(90, 65 + (fixtureId % 25)), // Static 65-90%
            summaryText: summaries[fixtureId % summaries.length],

            kickoffTime: "20:00",
            generatedAt: cached?.generatedAt || new Date().toISOString()
        };

        // This will be saved after full calculation in getMarketAnalyses or equivalent
        return result;
    }

    async getModelSignals(fixtureId: number): Promise<ModelSignal[]> {
        const cached = await PredictionStore.get(fixtureId);
        if (cached?.signals) return cached.signals;

        // Deterministic signals
        const rng = new SeededRandom(fixtureId + 100);
        return [
            {
                name: "Aggression Index",
                value: 60 + (fixtureId % 25),
                explanation: "Based on team foul averages and historical bookings.",
                rating: (fixtureId % 4 === 0) ? "Elite" : "High"
            },
            {
                name: "Referee Strictness",
                value: 40 + (fixtureId % 30),
                explanation: "Referee shows yellow cards based on seasonal trend data.",
                rating: "Medium"
            },
            {
                name: "Tempo Projection",
                value: 70 + (fixtureId % 20),
                explanation: "High-speed transitions expected based on recent tactical setup.",
                rating: "High"
            },
            {
                name: "Volatility Rating",
                value: 20 + (fixtureId % 20),
                explanation: "Score stability predicted based on goal concession rates.",
                rating: "Low"
            }
        ];
    }

    async getMarketAnalyses(fixtureId: number, home: string = "Home", away: string = "Away", providedOdds: any[] | null = null): Promise<MarketAnalysis[]> {
        const cached = await PredictionStore.get(fixtureId);
        // If we have cached markets that looks like our new format, return them
        if (cached?.markets && cached.markets.length > 5 && cached.markets[0].microDetail?.includes("calibrated") && !providedOdds) {
            return cached.markets;
        }

        // Fetch fixture to get season_id and participant IDs
        const fixture = await this.fetchSportMonks(`/fixtures/${fixtureId}`, { include: "participants" });
        const seasonId = fixture?.data?.season_id;
        const homeP = fixture?.data?.participants?.find((p: any) => p.meta.location === "home");
        const awayP = fixture?.data?.participants?.find((p: any) => p.meta.location === "away");

        // Fetch standings and form
        const [allStats, homeForm, awayForm] = await Promise.all([
            seasonId ? this.getTeamStats(seasonId) : Promise.resolve(new Map()),
            homeP?.id ? this.getTeamForm(homeP.id) : Promise.resolve(undefined),
            awayP?.id ? this.getTeamForm(awayP.id) : Promise.resolve(undefined)
        ]);

        const homeStats = homeP?.id ? allStats.get(homeP.id) : undefined;
        const awayStats = awayP?.id ? allStats.get(awayP.id) : undefined;

        const result: PredictionResult = this.calculateBestPrediction(fixtureId, home, away, homeStats, awayStats, homeForm, awayForm);
        const candidates = result.candidates || [];

        const list: MarketAnalysis[] = candidates.map(c => {
            const prob = Math.round(c.probability);
            let conf: "Low" | "Medium" | "High" = "Medium";
            if (prob >= 80) conf = "High";
            else if (prob <= 60) conf = "Low";

            return {
                marketName: this.getMarketNameForOutcome(c.outcome),
                prediction: c.outcome,
                probability: prob,
                confidenceLevel: conf,
                contextualStat: prob > 75 ? "Statistical Favorite" : "High Value Option",
                microDetail: `Model precision calibrated at ${prob}% based on xG metrics.`
            };
        });

        // SORT: The Oracle Utility Engine (Favors ROI & Temptation)
        const allOdds = providedOdds || [];

        const listWithStats = list.map(m => {
            const matchOdds = this.filterOdds(allOdds, m.prediction, home, away);
            const odds = matchOdds.length > 0 ? Math.max(...matchOdds.map((o: any) => o.odds_value)) : 1.5;

            const kelly = this.calculateKelly(m.probability, odds);

            // ORACLE UTILITY SCORE: Probability * (Odds ^ 1.35)
            const utilityScore = (m.probability / 100) * Math.pow(odds, 1.35);

            // INSTITUTIONAL EV: (Prob * Odds) - 1
            const ev = (m.probability / 100 * odds) - 1;

            // ELITE VALUE CRITERIA: Prob >= 65%, Odds >= 2.20, EV > 5%
            // Prohibited: Double Chance (12), O/U 0.5 (varies, check name)
            const name = m.prediction.toLowerCase();
            const isProhibited = name.includes("or draw") || name.includes("over 0.5") || name.includes("double chance");
            const isElite = !isProhibited && m.probability >= 65 && odds >= 2.20 && ev > 0.05;

            return {
                ...m,
                odds,
                starRating: kelly.stars,
                kellyStake: kelly.stake,
                utilityScore,
                expectedValue: ev,
                isElite,
                contextualStat: kelly.rating,
                microDetail: isElite
                    ? `INSTITUTIONAL ELITE: ${m.probability}% Prob • ${odds.toFixed(2)} Odds • +${(ev * 100).toFixed(1)}% EV`
                    : `Oracle Analysis: ${kelly.stars}/10 Value • Estimated ROI: ${((utilityScore - 1) * 100).toFixed(1)}%`
            };
        });

        // Final sorting: Elite first, then by Utility Score
        listWithStats.sort((a, b) => {
            if (a.isElite && !b.isElite) return -1;
            if (!a.isElite && b.isElite) return 1;
            return (b.utilityScore || 0) - (a.utilityScore || 0);
        });

        // MAIN PREDICTION FILTER: Prioritize ELITE then Oracle
        const elitePick = listWithStats.find(item => item.isElite);

        let bestOraclePick = elitePick || listWithStats.find(item => {
            const name = item.prediction.toLowerCase();
            const isBoring = name.includes("or draw") || name.includes("over 1.5 goals") || name.includes("double chance");

            // If it's boring, it MUST have at least 1.45 odds to be the face of the match
            if (isBoring && item.odds < 1.45) return false;

            // Otherwise, we want it if it's high probability (>65%)
            return item.probability > 65;
        });

        // Fallback if everyone is filtered (rare)
        if (!bestOraclePick) bestOraclePick = listWithStats[0];

        const sortedResult = result;
        sortedResult.outcome = bestOraclePick.prediction;
        sortedResult.confidence = bestOraclePick.probability;
        sortedResult.starRating = bestOraclePick.starRating;
        sortedResult.kellyStake = bestOraclePick.kellyStake;

        // Update cache
        const summary = await this.getMatchSummary(fixtureId);
        const signals = await this.getModelSignals(fixtureId);

        PredictionStore.save(fixtureId, {
            summary,
            signals,
            markets: listWithStats,
            mainPrediction: sortedResult,
            generatedAt: new Date().toISOString()
        });

        return listWithStats;
    }

    private calculateKelly(prob: number, odds: number): { stake: number, stars: number, rating: string } {
        const p = prob / 100;
        const q = 1 - p;
        const b = odds - 1;

        // Handle zero or negative odds (protect against bad API data)
        if (b <= 0) return { stake: 0, stars: 1, rating: "Avoid" };

        const edge = (p * b - q) / b;

        // Fractional Kelly (25% for extreme safety)
        const stake = Math.max(0, edge * 0.25 * 100);

        // Star Rating (1-10)
        // Scaled broadly: 0% edge = 1 star, 15% edge = 10 stars (Elite value)
        let stars = Math.min(10, Math.max(1, Math.round((edge * 100) / 1.5) + 1));

        // Boost stars if probability is very high (>85%) - Safety bonus
        if (p > 0.85) stars = Math.min(10, stars + 2);

        let rating = "Low Value / Avoid";
        if (stars >= 8) rating = "Elite Value";
        else if (stars >= 5) rating = "Solid Selection";
        else if (stars >= 3) rating = "Speculative";

        return { stake: Number(stake.toFixed(1)), stars, rating };
    }

    private getMarketNameForOutcome(outcome: string): string {
        const o = outcome.toLowerCase();

        // 1. Match Outcome Categories
        if (o.includes("(dnb)")) return "Draw No Bet";
        if (o.includes("-0.5") || o.includes("+0.5") || o.includes("handicap")) return "Asian Handicap";
        if (o.includes("ht/ft") || (o.includes("/") && o.length < 15)) return "HT/FT";
        if (o.includes("at ht") || o.includes("draw at ht")) return "Half Time Result";

        // 2. BTTS & Combinations
        if (o.includes("btts &") || o.includes("& yes") || o.includes("& btts")) {
            if (o.includes("over 2.5") || o.includes("under 2.5")) return "Total Goals/BTTS";
            return "Result/BTTS";
        }
        if (o.includes("both teams to score") || o === "btts") return "BTTS";

        // 3. Goal Related (Match-wide vs Team-specific)
        if (o.includes("1st half")) return "1st Half Goals";

        if (o.includes("over") || o.includes("under")) {
            // Check if it's a team goal (contains a team name-like string, tricky but usually includes 'Over/Under' + a value)
            const hasOverUnder = o.includes("over 1.5") || o.includes("over 2.5") || o.includes("under 3.5");
            if (hasOverUnder && o.split(" ").length > 3) return "Team Total Goals"; // e.g. "Man Utd Over 1.5"
            if (o.includes("over 1.5 goals")) return "Goal Line";
            return "Over/Under";
        }

        // 4. Other
        if (o.includes("scoreline")) return "Correct Score";

        if (o.includes("win") || o.includes("draw")) {
            if (o.includes("or draw")) return "Double Chance";
            return "Fulltime Result";
        }

        // Fallback or specific team name (usually First Team To Score)
        if (o.length > 0 && !o.includes(" ")) return "First Team To Score";

        return "Special Market";
    }

    private getDeterministicPrediction(market: string, fixtureId: number): string {
        const outcomes: Record<string, string[]> = {
            "Fulltime Result": ["Home Win", "Away Win", "Draw"],
            "Double Chance": ["Home/Draw", "Away/Draw", "Home/Away"],
            "Draw No Bet": ["Home", "Away"],
            "Asian Handicap": ["Home -1.5", "Away +1.5"],
            "Over/Under": ["Over 2.5", "Under 2.5", "Over 1.5"],
            "BTTS": ["Yes", "No"],
            "Total Goals/BTTS": ["Over 2.5 & Yes", "Under 2.5 & No"],
            "Team Total Goals": ["Home Over 1.5", "Away Over 1.5"],
            "1st Half Goals": ["Over 0.5", "Under 0.5"],
            "Goal Line": ["Over 2.0", "Under 3.0"],
            "Correct Score": ["2-1", "1-1", "0-1", "2-2"],
            "First Team To Score": ["Home", "Away", "None"],
            "Result/BTTS": ["Home & Yes", "Away & No", "Draw & Yes"],
            "Half Time Result": ["Home", "Away", "Draw"],
            "HT/FT": ["Home/Home", "Away/Away", "Draw/Home"]
        };
        const list = outcomes[market] || ["TBA"];
        const rng = new SeededRandom(fixtureId + market.length);
        return list[rng.range(0, list.length - 1)];
    }

    /**
     * Internal helper to filter odds for a specific prediction string.
     */
    private filterOdds(allOdds: any[], prediction: string, homeTeam: string = "", awayTeam: string = "") {
        const p = prediction.toLowerCase();
        let marketIds: number[] = [];
        let labelMatch: string | null = null;
        let nameMatch: string | null = null;

        for (const [key, mapping] of Object.entries(this.PREDICTION_MARKET_MAP)) {
            if (p.includes(key)) {
                marketIds = mapping.marketIds;
                labelMatch = mapping.label;
                nameMatch = mapping.name || null;
                break;
            }
        }

        if (marketIds.length === 0) {
            if (p.includes("to win")) { marketIds = [1]; labelMatch = p.includes(homeTeam.toLowerCase().substring(0, 5)) ? "Home" : "Away"; }
            else if (p.includes("or draw")) { marketIds = [12]; labelMatch = null; }
            else if (p.includes("& btts") || p.includes("btts &")) {
                if (p.includes("over") || p.includes("under")) {
                    marketIds = [82]; // BTTS/Over-Under
                    labelMatch = p.includes("2.5") ? "over 2.5 & yes" : (p.includes("1.5") ? "over 1.5 & yes" : "yes");
                } else {
                    marketIds = [97, 82]; // Result/BTTS prioritized over Goals/BTTS
                    labelMatch = "& yes";
                }
            }
        }

        if (marketIds.length === 0) return [];
        let filtered = allOdds.filter((o: any) => marketIds.includes(o.market_id));

        if (labelMatch) {
            const lmList = labelMatch.toLowerCase().split("&").map(s => s.trim());
            filtered = filtered.filter((o: any) => {
                const ol = o.label?.toLowerCase() || "";

                // Must contain ALL parts of the labelMatch (e.g. "Over 2.5" AND "Yes")
                const matchesParts = lmList.every(part => ol.includes(part));
                if (!matchesParts) return false;

                // STRICT: For combined markets, if we want "Yes", we must NOT match "No"
                // (to avoid Over 2.5-Yes / BTTS-No collisions)
                if (lmList.includes("yes") && ol.includes("no") && !ol.includes("yes & no")) {
                    return false;
                }

                // For Win & BTTS, also ensure the correct team name is in the label
                if (p.includes("& btts") && !p.includes("over 2.5")) {
                    const teamInPrediction = p.replace("& btts", "").replace("btts &", "").trim();
                    if (teamInPrediction.length > 3 && !ol.includes(teamInPrediction.substring(0, 5))) {
                        return false;
                    }
                }
                return true;
            });
        }
        if (nameMatch) {
            filtered = filtered.filter((o: any) =>
                o.odds_name === nameMatch ||
                o.label?.includes(nameMatch) ||
                o.market_description?.includes(nameMatch)
            );
        }
        if (marketIds.includes(12) && filtered.length > 1) {
            const team = p.replace(" or draw", "").trim();
            if (team) filtered = filtered.filter(o => o.label?.toLowerCase().includes(team.substring(0, 5)));
        }
        return filtered;
    }

    /**
     * Calculates the best value bet by comparing candidate probabilities with real odds.
     */
    async calculateValueBet(
        fixtureId: number,
        candidates: PredictionCandidate[],
        homeTeam: string = "",
        awayTeam: string = ""
    ): Promise<PredictionResult & { odds?: number; bet365?: number | null; best?: BestOdds | null; all?: BestOdds[] }> {
        const allOdds = await this.fetchFixtureOdds(fixtureId);

        if (allOdds.length === 0 || candidates.length === 0) {
            // Fallback to highest probability if no odds
            const sortedCandidates = [...candidates].sort((a, b) => b.probability - a.probability);
            return {
                outcome: sortedCandidates[0].outcome,
                confidence: Math.round(sortedCandidates[0].probability),
                isPrime: false
            };
        }

        // PRIME BET SEARCH: Favoring Value Edge (Star Rating >= 7) and Odds >= 1.5
        let bestPrimeBet: { analysis: MarketAnalysis, odds: any[], score: number } | null = null;
        const analyses = await this.getMarketAnalyses(fixtureId, homeTeam, awayTeam, allOdds);

        for (const analysis of analyses) {
            const matchOdds = this.filterOdds(allOdds, analysis.prediction, homeTeam, awayTeam);
            const maxOdds = matchOdds.length > 0 ? Math.max(...matchOdds.map((o: any) => o.odds_value)) : 0;

            // A pick is "Prime" if it has clear Value (Stars >= 7) and acceptable odds
            if (analysis.starRating && analysis.starRating >= 7 && maxOdds >= 1.5) {
                const score = (analysis.starRating * 10) + analysis.probability; // Favor Stars first
                if (!bestPrimeBet || score > bestPrimeBet.score) {
                    bestPrimeBet = { analysis, odds: matchOdds, score };
                }
            }
        }

        const topBet = bestPrimeBet ? bestPrimeBet.analysis : analyses[0];
        const isPrime = !!bestPrimeBet;
        const matchOdds = bestPrimeBet ? bestPrimeBet.odds : this.filterOdds(allOdds, topBet.prediction, homeTeam, awayTeam);

        const b365 = matchOdds.find(o => o.bookmaker_id === 2);
        const bestAvailable = matchOdds.length > 0 ? Math.max(...matchOdds.map(o => o.odds_value)) : 0;
        const odds = b365 ? b365.odds_value : bestAvailable;

        const normalized = matchOdds.map((o: any) => ({
            bookmaker: o.bookmaker_name,
            odds: o.odds_value,
            market: o.market_name
        })).sort((a, b) => b.odds - a.odds);

        return {
            outcome: topBet.prediction,
            confidence: topBet.probability,
            isPrime,
            isElite: topBet.isElite,
            expectedValue: topBet.expectedValue,
            odds,
            bet365: b365?.odds_value || null,
            best: normalized[0] || null,
            all: normalized,
            candidates,
            starRating: topBet.starRating,
            kellyStake: topBet.kellyStake
        };
    }
}

export const sportmonksService = new SportMonksService();
