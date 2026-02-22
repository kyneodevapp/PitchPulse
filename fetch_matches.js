const https = require('https');

const API_KEY = "QvAxap56S4mEMq4Wr1BWdrmbhnfLxhD8dmrMbPgyZBTKF4CU0WS3sFWbtHYV";
const LEAGUE_IDS = "2,5,8,9,564,567,82,384,387";

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.sportmonks.com/v3/football/fixtures/between/${today}/${today}?api_token=${API_KEY}&include=participants;league&filters=fixtureLeagues:${LEAGUE_IDS}`;

    try {
        const data = await fetch(url);
        if (!data.data || data.data.length === 0) {
            console.log("No matches found for today.");
            return;
        }

        console.log(`Found ${data.data.length} matches.`);
        data.data.slice(0, 5).forEach(f => {
            const home = f.participants.find(p => p.meta.location === 'home')?.name;
            const away = f.participants.find(p => p.meta.location === 'away')?.name;
            console.log(`MATCH_ID: ${f.id} | ${home} vs ${away} | LEAGUE: ${f.league.name}`);
        });
    } catch (e) {
        console.error(e);
    }
}

run();
