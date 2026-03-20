// 后端入口：提供 /api/* 聚合接口，给前端统一访问。
const express = require('express');

const app = express();
const PORT = 3000;

// 简化版 CORS 处理中间件，支持浏览器跨域调用。
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const origJson = res.json.bind(res);
  res.json = function (data) {
    this.header('Access-Control-Allow-Origin', '*');
    return origJson(data);
  };
  next();
});

app.use(express.json());

app.use('/api', require('./routes/market'));
app.use('/api', require('./routes/futures'));
app.use('/api', require('./routes/sentiment'));
app.use('/api', require('./routes/news'));
app.use('/api', require('./routes/proxy'));
app.use('/api', require('./routes/live'));

app.get('/ping', (req, res) => res.json({ ok: true, t: Date.now() }));

app.listen(PORT, () => console.log(`CTBox API running on port ${PORT}`));

