// POST /api/orders: the checkout saves a new order here after it is sent (shop.js, service-pay.js).
// Only "received" orders can be made here; every later status is set by the owner on /admin/orders/.
import { env } from 'cloudflare:workers';
import { db, handle, json, body, clean, digits, limit, now, ID_RE, HttpError } from '../../lib/orders.js';

export const prerender = false;

export const POST = handle(async ({ request }) => {
  await limit(env.ORDER_LIMIT, request);
  const b = await body(request);
  const id = clean(b.id, 30).toUpperCase();
  if (!ID_RE.test(id)) throw new HttpError(400, 'Not a valid order ID.');
  const phone = clean(b.phone, 25);
  const email = clean(b.email, 120).toLowerCase();
  if (digits(phone).length < 4 && !email.includes('@')) throw new HttpError(400, 'A phone number or an email is needed to track the order.');
  const at = now();
  const history = JSON.stringify([{ status: 'received', at, note: clean(b.method, 80) }]);
  const DB = await db();
  // An order ID that is already saved is left as it is (sending twice does not change it)
  await DB.prepare(`INSERT OR IGNORE INTO orders (id, status, name, phone, email, items, total, method, note, history, created_at, updated_at)
    VALUES (?, 'received', ?, ?, ?, ?, ?, ?, '', ?, ?, ?)`)
    .bind(id, clean(b.name, 100), phone, email, clean(b.items, 1500), clean(b.total, 40), clean(b.method, 80), history, at, at).run();
  return json({ ok: true, id, track: `/track/?id=${encodeURIComponent(id)}` }, 201);
});
