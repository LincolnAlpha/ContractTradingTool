// 直播数据路由：从目标站点抓取在线直播间列表并短期缓存。
const express = require('express');
const router = express.Router();
const { fetch } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';
const LIVE_PAGE_URL = process.env.LIVE_PAGE_URL || '';
const LIVE_API_URL = process.env.LIVE_API_URL || '';
const LIVE_REFERER = process.env.LIVE_REFERER || '';
const LIVE_ORIGIN = process.env.LIVE_ORIGIN || '';

// 当前为占位抓取逻辑：需要补齐真实页面 URL 与接口 URL。
async function getLiveData() {
  if (!LIVE_PAGE_URL || !LIVE_API_URL) {
    throw new Error('live source not configured');
  }
  // 第一步先抓页面，通常 token 会内嵌在 HTML/脚本里。
  const pageRes = await fetch(LIVE_PAGE_URL, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' }
  });
  const html = await pageRes.text();
  const m = html.match(/token=([a-f0-9]{32})/);
  if (!m) throw new Error('token not found');
  const token = m[1];
  // 目前 token 只做示例提取，后续应拼入真实 API 请求参数。

  const r = await fetch(LIVE_API_URL, {
    headers: {
      'User-Agent': UA,
      'Referer': LIVE_REFERER || LIVE_PAGE_URL,
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': LIVE_ORIGIN
    }
  });
  const data = await r.json();
  if (!data || !data.list) throw new Error('invalid data');
  // 仅保留正在直播中的房间。
  data.list = data.list.filter(i => i.live_status === '1');
  data.liveNum = data.list.length;
  return data;
}

router.get('/live', async (req, res) => {
  // 直播列表更新频率高，缓存 60 秒减少抓取频次。
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
