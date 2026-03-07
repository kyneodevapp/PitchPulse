/**
 * PitchPulse — League ID Discovery Script
 * Run once: node scripts/find-leagues.js
 * Queries Sportmonks v3 /football/leagues and prints IDs for target competitions.
 */

const API_KEY = 'QvAxap56S4mEMq4Wr1BWdrmbhnfLxhD8dmrMbPgyZBTKF4CU0WS3sFWbtHYV';
const BASE_URL = 'https://api.sportmonks.com/v3/football';

const TARGET_LEAGUES = [
    'europa conference league',
    'fa cup',
    'efl cup',
    'carabao cup',
    'bundesliga 2',
    '2. bundesliga',
    'league one',
    'league two',
    'primeira liga b',
    'greek super league',
    'super league 1',
    'austrian bundesliga',
    'swiss super league',
    'danish superliga',
    'championship',    // verify existing
    'premier league',  // verify existing
    'champions league',// verify existing
    'europa league',   // verify existing
    'la liga',
    'serie a',
    'bundesliga',
    'eredivisie',
    'ligue 1',
    'scottish premiership',
    'liga portugal',
    'premier lig',    // Turkish Süper Lig
    'belgian',
];

async function fetchLeagues(page = 1) {
    const url = `${BASE_URL}/leagues?api_token=${API_KEY}&per_page=50&page=${page}`;
    const res = await fetch(url);
    const json = await res.json();
    return json;
}

async function main() {
    console.log('\n🔍  PitchPulse — Sportmonks League ID Discovery\n');
    console.log('='.repeat(60));

    const allLeagues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        process.stdout.write(`  Fetching page ${page}...`);
        const data = await fetchLeagues(page);
        if (!data?.data || data.data.length === 0) {
            console.log(' empty, stopping.');
            break;
        }
        allLeagues.push(...data.data);
        hasMore = data.pagination?.has_more === true;
        console.log(` got ${data.data.length} leagues (total: ${allLeagues.length})`);
        page++;
        // Small delay to avoid hammering the API
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅  Total leagues available on your plan: ${allLeagues.length}`);
    console.log('\n📋  TARGET LEAGUE MATCHES:\n');

    const found = [];
    for (const target of TARGET_LEAGUES) {
        const matches = allLeagues.filter(l =>
            l.name?.toLowerCase().includes(target) ||
            target.includes(l.name?.toLowerCase())
        );
        if (matches.length > 0) {
            for (const m of matches) {
                found.push({ id: m.id, name: m.name, short: m.short_code || '' });
                console.log(`  ✅  ID: ${String(m.id).padEnd(6)} | ${m.name} (${m.short_code || '—'})`);
            }
        } else {
            console.log(`  ❌  No match for: "${target}"`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📦  COPY-PASTE ARRAY FOR constants.ts:\n');
    const unique = [...new Map(found.map(l => [l.id, l])).values()];
    unique.sort((a, b) => a.id - b.id);
    console.log(unique.map(l => `    // ${l.name}\n    { id: ${l.id}, name: "${l.name}", country: "TBD" },`).join('\n'));

    console.log('\n' + '='.repeat(60));
    console.log('\n📊  FULL LIST (all available leagues) — scroll to review:\n');
    allLeagues
        .sort((a, b) => a.id - b.id)
        .forEach(l => console.log(`  ${String(l.id).padEnd(6)} | ${l.name}`));
}

main().catch(console.error);
