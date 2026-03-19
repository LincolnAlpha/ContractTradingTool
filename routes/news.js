const express = require('express');
const router = express.Router();
const { fetch, UA } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

const RSS_SOURCES = [
  { url: '', name: '' },
  { url: '', name: '' },
];

function parseRSS(xml, sourceName) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                   block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    if (title.trim()) {
      items.push({
        title: title.trim(),
        published_at: pubDate ? new Date(pubDate).toISOString() : '',
        source: sourceName,
        url: link.trim()
      });
    }
  }
  return items.slice(0, 8);
}

router.get('/news', async (req, res) => {
  const coin = (req.query.coin || 'BTC').toUpperCase();
  const cacheKey = `news_${coin}`;
  const cached = cGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = await Promise.allSettled(
      RSS_SOURCES.map(s =>
        fetch(s.url, { headers: { 'User-Agent': UA } })
          .then(r => r.text())
          .then(xml => parseRSS(xml, s.name))
      )
    );
    let all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const keywords = [coin, coin.toLowerCase(), 'crypto', 'bitcoin', 'btc', 'ethereum', 'eth'];
    const filtered = all.filter(item =>
      keywords.some(k => item.title.toLowerCase().includes(k))
    );
    const final = (filtered.length >= 3 ? filtered : all).slice(0, 10);
    const resp = { items: final, updated: Date.now() };
    cSet(cacheKey, resp, 120000);
    res.json(resp);
  } catch(e) {
    res.status(502).json({ error: e.message, items: [] });
  }
});

module.exports = router;
