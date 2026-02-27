/**
 * Shared application-level constants used across multiple components.
 * Single source of truth — import from here, never redefine locally.
 */

export const SUPPORTED_LEAGUES = [
    { id: 2, name: "Champions League", country: "Europe" },
    { id: 5, name: "Europa League", country: "Europe" },
    { id: 8, name: "Premier League", country: "England" },
    { id: 9, name: "Championship", country: "England" },
    { id: 564, name: "La Liga", country: "Spain" },
    { id: 567, name: "La Liga 2", country: "Spain" },
    { id: 82, name: "Bundesliga", country: "Germany" },
    { id: 384, name: "Serie A", country: "Italy" },
    { id: 387, name: "Serie B", country: "Italy" },
    { id: 301, name: "Ligue 1", country: "France" },
    { id: 72, name: "Eredivisie", country: "Netherlands" },
    { id: 501, name: "Scottish Premiership", country: "Scotland" },
    { id: 462, name: "Liga Portugal", country: "Portugal" },
    { id: 600, name: "Süper Lig", country: "Turkey" },
    { id: 208, name: "Belgian Pro League", country: "Belgium" },
] as const;

export type SupportedLeague = (typeof SUPPORTED_LEAGUES)[number];
