// 直播数据路由：从目标站点抓取在线直播间列表并短期缓存。
const express = require('express');
const router = express.Router();
const { fetch } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';

// 当前为占位抓取逻辑：需要补齐真实页面 URL 与接口 URL。
async function getLiveData() {
  const pageRes = await fetch('', {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' }
  });
  const html = await pageRes.text();
  const m = html.match(/token=([a-f0-9]{32})/);
  if (!m) throw new Error('token not found');
  const token = m[1];

  const r = await fetch(``, {
    headers: {
      'User-Agent': UA,
      'Referer': '',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': ''
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
