const cache = new Map();

function cGet(key) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() > v.exp) { cache.delete(key); return null; }
  return v.data;
}

function cSet(key, data, ttlMs) {
  cache.set(key, { data, exp: Date.now() + ttlMs });
}

module.exports = { cGet, cSet };
