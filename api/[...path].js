// api/[...path].js — proxies the FPL API, adds CORS, and mimics a browser
// so Fantasy Premier League doesn't block the request from Vercel's servers.

export default async function handler(req, res) {
  const path = (req.query.path || []).filter(Boolean).join('/');
  const upstream = `https://fantasy.premierleague.com/api/${path}/`;
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const r = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Referer': 'https://fantasy.premierleague.com/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const body = await r.text();

    // If FPL still refuses, surface what it said so it's easy to diagnose.
    if (!r.ok) {
      res.status(502).json({ error: `FPL returned ${r.status}`, upstream, snippet: body.slice(0, 300) });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(body);
  } catch (e) {
    res.status(502).json({ error: 'fetch failed', detail: String(e) });
  }
}
