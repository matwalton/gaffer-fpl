// Save as:  api/[...path].js
// Proxies the public Fantasy Premier League API and adds the CORS header
// browsers need. No dependencies — Vercel's Node runtime has fetch built in.

export default async function handler(req, res) {
  const path = (req.query.path || []).filter(Boolean).join('/');
  const upstream = `https://fantasy.premierleague.com/api/${path}/`;

  try {
    // FPL rejects requests with no User-Agent, so set one.
    const r = await fetch(upstream, { headers: { 'User-Agent': 'gaffer-fpl' } });
    const body = await r.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // 5-min edge cache
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(body);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: 'upstream fetch failed' });
  }
}
