const express = require('express');
const router = express.Router();
const { fetch, UA } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

router.get('/news', async (req, res) => {
  const coin = (req.query.coin||'BTC').toUpperCase();
  const ck = 'news:' + coin;
  const hit = cGet(ck);
  if (hit) return res.json(hit);
  const results = [];
  for (const url of [
    `https://cryptocurrency.cv/api/news?ticker=${coin}&limit=15`,
    `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&currencies=${coin}&kind=news&public=true`,
  ]) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const d = await r.json();
      (d.articles||d.results||[]).slice(0,12).forEach(a => results.push({
        title: a.title||'', url: a.url||a.link||'',
        source: a.source||a.domain||'News', time: a.published_at||a.date||''
      }));
      if (results.length >= 8) break;
    } catch {}
  }
  const payload = { results, coin, total: results.length };
  cSet(ck, payload, 300000);
  res.json(payload);
});

module.exports = router;
