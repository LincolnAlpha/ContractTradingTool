// fetch 服务层：统一 User-Agent + TTL 缓存，减少重复请求与外部限流风险。
const fetch = require('node-fetch');
const { cGet, cSet } = require('./cache');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';

async function fetchJSON(url, ttlMs = 15000) {
  const cached = cGet(url);
  if (cached) return cached;
  const r = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 10000 });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  cSet(url, data, ttlMs);
  return data;
}

module.exports = { fetch, fetchJSON, UA };
