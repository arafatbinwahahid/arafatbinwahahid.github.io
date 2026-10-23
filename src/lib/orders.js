// Order tracking on Cloudflare: orders live in the D1 database "DB" (wrangler.jsonc).
// The table is made on first use, so nothing has to be set up by hand.
import { env } from 'cloudflare:workers';
import track from '../../data/pages/track.json';
import payments from '../../data/global/payments.json';

export const STATUSES = track.statuses.map((s) => s.id);
// Order IDs look like AB-261023-K7Q2M (payments.json "orderPrefix", date, 5 letters/digits)
export const ID_RE = /^[A-Z0-9]{1,10}-\d{6}-[A-Z0-9]{5}$/;
export const PREFIX = payments.orderPrefix || 'AB';

let ready = null;
export function db() {
  if (!env.DB) throw new HttpError(503, 'The order database is not connected (wrangler.jsonc → d1_databases → DB).');
  ready ||= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, status TEXT NOT NULL, name TEXT, phone TEXT, email TEXT,
      items TEXT, total TEXT, method TEXT, note TEXT, history TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS orders_updated ON orders (updated_at)'),
  ]).catch((e) => { ready = null; throw e; });
  return ready.then(() => env.DB);
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

// Wraps an API handler: errors become JSON replies, never a stack trace
export const handle = (fn) => async (ctx) => {
  try {
    return await fn(ctx);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

export async function body(request, max = 8000) {
  const text = await request.text();
  if (text.length > max) throw new HttpError(413, 'Too much data.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Not valid JSON.'); }
}

// Short, clean text fields (no control characters, limited length)
export const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
export const digits = (v) => String(v ?? '').replace(/\D/g, '');

// Rate limit per visitor (wrangler.jsonc → ratelimits). Without the binding (local tests) nothing is limited.
export async function limit(binding, request) {
  if (!binding) return;
  const key = request.headers.get('cf-connecting-ip') || 'local';
  const { success } = await binding.limit({ key });
  if (!success) throw new HttpError(429, 'Too many tries. Please wait a minute and try again.');
}

// Admin: the password is the secret ADMIN_PASSWORD (Cloudflare → Worker → Settings → Variables and Secrets)
export async function requireAdmin(request) {
  const pass = env.ADMIN_PASSWORD;
  if (!pass) throw new HttpError(503, 'Set the secret ADMIN_PASSWORD in Cloudflare first (Worker → Settings → Variables and Secrets).');
  await limit(env.ADMIN_LIMIT, request);
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([given, pass].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))));
  // Same-time compare, so the password cannot be guessed letter by letter
  if (!crypto.subtle.timingSafeEqual(a, b)) throw new HttpError(401, 'Wrong password.');
}

export const now = () => new Date().toISOString();

// What a buyer may see about their order (never the phone, email or name)
export const publicOrder = (o) => ({
  id: o.id, status: o.status, items: o.items, total: o.total, method: o.method, note: o.note,
  history: JSON.parse(o.history || '[]').map(({ status, at, note }) => ({ status, at, note })), createdAt: o.created_at, updatedAt: o.updated_at,
});
