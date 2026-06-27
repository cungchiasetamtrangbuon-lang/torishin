const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
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

module.exports = async function handler(req, res) {
  setHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('key') || 'torishin_rev_v3';

    if (req.method === 'GET') {
      const store = await readStore();
      res.status(200).json({ ok: true, key, data: store[key] || null });
      return;
    }

    if (req.method === 'POST') {
      let body = {};
      if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const text = Buffer.concat(chunks).toString('utf8');
        if (text) body = JSON.parse(text);
      }

      const store = await readStore();
      store[key] = body.data || {};
      await writeStore(store);
      res.status(200).json({ ok: true, key, data: store[key] });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
