// 安全代理路由：
// 仅允许白名单域名通过，避免前端可被用于任意开放代理。
const express = require('express');
const router = express.Router();
const { fetch, UA } = require('../services/fetch');
const { cGet, cSet } = require('../services/cache');

// 部署时请替换成真实域名白名单，例如 ['api.binance.com', 'fapi.binance.com']。
const ALLOWED = [''];

router.get('/proxy', async (req, res) => {
  try {
    const target = req.query.u;
    if (!target) return res.status(400).json({ error: 'missing u' });
    const host = new URL(target).hostname;
    if (!ALLOWED.some(d => host === d || host.endsWith('.'+d)))
      return res.status(403).json({ error: 'domain not allowed' });
    const cached = cGet(target);
    if (cached) return res.json(cached);
    const r = await fetch(target, { headers: { 'User-Agent': UA } });
    if (!r.ok) return res.status(r.status).json({ error: `HTTP ${r.status}` });
    const data = await r.json();
    cSet(target, data, 30000);
    res.json(data);
  } catch (e) { res.status(502).json({ error: e.message }); }
});

module.exports = router;
