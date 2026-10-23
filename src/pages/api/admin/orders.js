// /api/admin/orders: the owner's order list (page /admin/orders/). Every call needs the ADMIN_PASSWORD secret.
//   GET                       list (newest first), ?q= search in ID, name, phone, email, items
//   POST {id?, ...fields}     new order (no id = a new ID is made) or change an order; a new status is added to its history
//   DELETE ?id=               remove an order
import { db, handle, json, body, clean, requireAdmin, now, ID_RE, PREFIX, STATUSES, HttpError } from '../../../lib/orders.js';

export const prerender = false;

const newId = () => {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = [...crypto.getRandomValues(new Uint8Array(5))].map((n) => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[n % 34]).join('');
  return `${PREFIX}-${ymd}-${rand}`;
};

export const GET = handle(async ({ request, url }) => {
  await requireAdmin(request);
  const q = clean(url.searchParams.get('q'), 100);
  const status = clean(url.searchParams.get('status'), 30);
  const where = [];
  const args = [];
  if (q) { where.push('(id LIKE ?1 OR name LIKE ?1 OR phone LIKE ?1 OR email LIKE ?1 OR items LIKE ?1)'); args.push(`%${q}%`); }
  if (status) { where.push(`status = ?${args.length + 1}`); args.push(status); }
  const sql = `SELECT * FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC LIMIT 300`;
  const { results } = await (await db()).prepare(sql).bind(...args).all();
  return json({ orders: results.map((o) => ({ ...o, history: JSON.parse(o.history || '[]') })) });
});

export const POST = handle(async ({ request }) => {
  await requireAdmin(request);
  const b = await body(request);
  const DB = await db();
  const at = now();
  const status = clean(b.status, 30) || 'received';
  if (!STATUSES.includes(status)) throw new HttpError(400, `Status must be one of: ${STATUSES.join(', ')}`);
  const fields = { name: clean(b.name, 100), phone: clean(b.phone, 25), email: clean(b.email, 120).toLowerCase(), items: clean(b.items, 1500), total: clean(b.total, 40), method: clean(b.method, 80), note: clean(b.note, 1000) };
  const old = b.id ? await DB.prepare('SELECT * FROM orders WHERE id = ?').bind(clean(b.id, 30).toUpperCase()).first() : null;
  if (!old) {
    const id = b.id ? clean(b.id, 30).toUpperCase() : newId();
    if (!ID_RE.test(id)) throw new HttpError(400, 'Order IDs look like AB-261023-K7Q2M.');
    const history = JSON.stringify([{ status, at, note: clean(b.historyNote, 300) }]);
    await DB.prepare(`INSERT INTO orders (id, status, name, phone, email, items, total, method, note, history, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, status, ...Object.values(fields), history, at, at).run();
    return json({ ok: true, id }, 201);
  }
  const history = JSON.parse(old.history || '[]');
  if (status !== old.status || b.historyNote) history.push({ status, at, note: clean(b.historyNote, 300) });
  await DB.prepare(`UPDATE orders SET status = ?, name = ?, phone = ?, email = ?, items = ?, total = ?, method = ?, note = ?, history = ?, updated_at = ? WHERE id = ?`)
    .bind(status, ...Object.values(fields), JSON.stringify(history.slice(-50)), at, old.id).run();
  return json({ ok: true, id: old.id });
});

export const DELETE = handle(async ({ request, url }) => {
  await requireAdmin(request);
  const id = clean(url.searchParams.get('id'), 30).toUpperCase();
  await (await db()).prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  return json({ ok: true });
});
