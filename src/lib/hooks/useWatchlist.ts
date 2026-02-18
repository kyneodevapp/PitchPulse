"use client";

import { useState, useEffect } from "react";

export interface WatchlistMatch {
    matchId: number;
    homeTeam: string;
    awayTeam: string;
    kickoff: string;
    league: string;
}

const STORAGE_KEY = "pitchpulse_watchlist";

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<WatchlistMatch[]>([]);

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    }, [watchlist]);

    const addToWatchlist = (match: WatchlistMatch) => {
        setWatchlist((prev) => {
            if (prev.some((m) => m.matchId === match.matchId)) return prev;
            return [...prev, match];
        });
    };

    const removeFromWatchlist = (matchId: number) => {
        setWatchlist((prev) => prev.filter((m) => m.matchId !== matchId));
    };

    const isInWatchlist = (matchId: number) => {
        return watchlist.some((m) => m.matchId === matchId);
    };

    const toggleWatchlist = (match: WatchlistMatch) => {
        if (isInWatchlist(match.matchId)) {
            removeFromWatchlist(match.matchId);
            return false;
        } else {
            addToWatchlist(match);
            return true;
        }
    };

    return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist };
}
