/**
 * Shared application-level constants used across multiple components.
 * Single source of truth — import from here, never redefine locally.
 * 
 * League IDs confirmed via Sportmonks API on 2026-03-07.
 */

export const SUPPORTED_LEAGUES = [
    // ===== European =====
    { id: 2, name: "Champions League", country: "Europe" },
    { id: 5, name: "Europa League", country: "Europe" },
    { id: 2286, name: "Europa Conference League", country: "Europe" },
    // ===== England =====
    { id: 8, name: "Premier League", country: "England" },
    { id: 9, name: "Championship", country: "England" },
    { id: 24, name: "FA Cup", country: "England" },
    { id: 27, name: "Carabao Cup", country: "England" },
    // ===== Spain =====
    { id: 564, name: "La Liga", country: "Spain" },
    { id: 567, name: "La Liga 2", country: "Spain" },
    { id: 570, name: "Copa Del Rey", country: "Spain" },
    // ===== Germany =====
    { id: 82, name: "Bundesliga", country: "Germany" },
    // ===== Italy =====
    { id: 384, name: "Serie A", country: "Italy" },
    { id: 387, name: "Serie B", country: "Italy" },
    { id: 390, name: "Coppa Italia", country: "Italy" },
    // ===== France =====
    { id: 301, name: "Ligue 1", country: "France" },
    // ===== Netherlands =====
    { id: 72, name: "Eredivisie", country: "Netherlands" },
    // ===== Portugal =====
    { id: 462, name: "Liga Portugal", country: "Portugal" },
    // ===== Scotland =====
    { id: 501, name: "Premiership", country: "Scotland" },
    // ===== Turkey =====
    { id: 600, name: "Süper Lig", country: "Turkey" },
    // ===== Belgium =====
    { id: 208, name: "Pro League", country: "Belgium" },
    // ===== Austria =====
    { id: 181, name: "Admiral Bundesliga", country: "Austria" },
    // ===== Denmark =====
    { id: 271, name: "Superliga", country: "Denmark" },
    // ===== Greece =====
    { id: 591, name: "Super League", country: "Greece" },
] as const;

export type SupportedLeague = (typeof SUPPORTED_LEAGUES)[number];
