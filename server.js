const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'torishin-sync.json');

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readStore() {
  try {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

async function writeStore(payload) {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (req, res) => {
  setHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('key') || 'torishin_rev_v3';

    if (req.method === 'GET') {
      const store = await readStore();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, key, data: store[key] || null }));
      return;
    }

    if (req.method === 'POST') {
      let body = {};
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const text = Buffer.concat(chunks).toString('utf8');
      if (text) body = JSON.parse(text);

      const store = await readStore();
      store[key] = body.data || {};
      await writeStore(store);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, key, data: store[key] }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Torishin sync server listening on http://localhost:${PORT}`);
});
