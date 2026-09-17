// api/ai.js — turns the computed Gameweek plan into a manager's briefing via Claude.
// Setup: Vercel → Settings → Environment Variables → add ANTHROPIC_API_KEY (your key).
// Cost is a fraction of a cent per briefing. Change the model below if you like.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(400).json({ error: 'no-key' }); return; }

  let raw = '';
  await new Promise(r => { req.on('data', c => raw += c); req.on('end', r); });
  let prompt = '';
  try { prompt = (JSON.parse(raw || '{}').prompt || '').slice(0, 6000); } catch (e) {}
  if (!prompt) { res.status(400).json({ error: 'no-prompt' }); return; }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const d = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: 'anthropic', detail: d }); return; }
    const text = (d.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n').trim();
    res.status(200).json({ text: text || '(no response)' });
  } catch (e) {
    res.status(502).json({ error: 'ai-failed', detail: String(e) });
  }
};
