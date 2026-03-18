const express = require('express');
const router = express.Router();
const { fetch } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';

async function getLiveData() {
  const pageRes = await fetch('https://567btc.com/all', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' }
  });
  const html = await pageRes.text();
  const m = html.match(/token=([a-f0-9]{32})/);
  if (!m) throw new Error('token not found');
  const token = m[1];

  const r = await fetch(`https://567btc.com/api/live/live_list?token=${token}&type=all`, {
    headers: {
      'User-Agent': UA,
      'Referer': 'https://567btc.com/all',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://567btc.com'
    }
  });
  const data = await r.json();
  if (!data || !data.list) throw new Error('invalid data');
  data.list = data.list.filter(i => i.live_status === '1');
  data.liveNum = data.list.length;
  return data;
}

router.get('/live', async (req, res) => {
  const cached = cGet('live_list');
  if (cached) return res.json(cached);
  try {
    const data = await getLiveData();
    cSet('live_list', data, 60000);
    res.json(data);
  } catch(e) {
    res.status(502).json({ error: e.message, list: [] });
  }
});

module.exports = router;
