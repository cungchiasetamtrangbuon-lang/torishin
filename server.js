const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'torishin-sync.json');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── File storage (local dev fallback) ─────────────────────────
async function fileRead() {
  try {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    return JSON.parse(await fs.promises.readFile(DATA_FILE, 'utf8'));
  } catch { return {}; }
}
async function fileWrite(store) {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

// ── Supabase REST helpers ──────────────────────────────────────
async function sbGet(key) {
  const url = `${SUPABASE_URL}/rest/v1/kv_store?key=eq.${encodeURIComponent(key)}&select=data`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}`);
  const rows = await res.json();
  return rows?.[0]?.data ?? null;
}
async function sbSet(key, data) {
  const url = `${SUPABASE_URL}/rest/v1/kv_store`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ key, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase POST ${res.status}`);
}

// ── HTTP server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setHeaders(res);
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('key') || 'torishin_rev_v3';

    if (req.method === 'GET') {
      const data = useSupabase ? await sbGet(key) : (await fileRead())[key] ?? null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, key, data }));
      return;
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      const postKey = body.key || key;
      const data = body.data ?? {};

      if (useSupabase) {
        await sbSet(postKey, data);
      } else {
        const store = await fileRead();
        store[postKey] = data;
        await fileWrite(store);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, key: postKey, data }));
      return;
    }

    res.writeHead(405);
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Torishin sync [${useSupabase ? 'Supabase ✓' : 'local file'}] → port ${PORT}`);
});
