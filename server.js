// 后端入口：提供 /api/* 聚合接口，给前端统一访问。
require('dotenv').config();
const express = require('express');

const app = express();
// 默认 3000，可通过环境变量 PORT 覆盖。
const PORT = Number(process.env.PORT || 3000);

// 简化版 CORS 处理中间件，支持浏览器跨域调用。
app.use((req, res, next) => {
  // 允许任意来源访问（开发方便，生产建议收敛为受控域名）。
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // 预检请求直接返回，减少后续中间件开销。
  if (req.method === 'OPTIONS') return res.status(204).end();
  const origJson = res.json.bind(res);
  res.json = function (data) {
    this.header('Access-Control-Allow-Origin', '*');
    return origJson(data);
  };
  next();
});

app.use(express.json());

// 按功能模块挂载路由，统一前缀 /api。
app.use('/api', require('./routes/market'));
app.use('/api', require('./routes/futures'));
app.use('/api', require('./routes/sentiment'));
app.use('/api', require('./routes/news'));
app.use('/api', require('./routes/proxy'));
app.use('/api', require('./routes/live'));

app.get('/ping', (req, res) => res.json({ ok: true, t: Date.now() }));

// 启动服务并输出监听日志，便于本地调试确认。
app.listen(PORT, () => console.log(`CTBox API running on port ${PORT}`));

