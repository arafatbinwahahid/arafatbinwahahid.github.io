// GET /api/track?id=AB-261023-K7Q2M&check=1234 (last 4 digits of the phone) or &check=email
// The same "not found" reply comes for a wrong ID and a wrong check, so nobody can find out which orders exist.
import { env } from 'cloudflare:workers';
import { db, handle, json, clean, digits, limit, publicOrder, HttpError } from '../../lib/orders.js';

export const prerender = false;

export const GET = handle(async ({ request, url }) => {
  await limit(env.TRACK_LIMIT, request);
  const id = clean(url.searchParams.get('id'), 30).toUpperCase();
  const check = clean(url.searchParams.get('check'), 120).toLowerCase();
  const notFound = new HttpError(404, 'not found');
  if (!id || !check) throw notFound;
  const o = await (await db()).prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!o) throw notFound;
  const last4 = check.replace(/[\s-]/g, '');
  const byPhone = /^\d{4}$/.test(last4) && digits(o.phone).length >= 4 && digits(o.phone).endsWith(last4);
  const byEmail = check.includes('@') && o.email && o.email === check;
  if (!byPhone && !byEmail) throw notFound;
  return json(publicOrder(o));
});
