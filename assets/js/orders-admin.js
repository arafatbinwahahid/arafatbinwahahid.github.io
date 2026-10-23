// The owner's orders page (/admin/orders/): talks to /api/admin/orders with the ADMIN_PASSWORD secret.
const root = document.querySelector('[data-orders]');
const $ = (s) => root.querySelector(s);
const D = JSON.parse(document.getElementById('orders-data').textContent);
const S = Object.fromEntries(D.statuses.map((s) => [s.id, s]));
const dlg = $('[data-edit]');
const f = $('[data-edit-form]');
let pass = sessionStorage.getItem('ordersPass') || '';
let orders = [];
const when = (iso) => new Date(iso).toLocaleString(D.locale, { dateStyle: 'medium', timeStyle: 'short' });
const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text != null ? { textContent: text } : {});
const say = (node, text, ok) => { node.textContent = text; node.className = `status ${ok ? 'ok' : 'err'}`; };

async function api(method, query = '', data) {
  const r = await fetch(`/api/admin/orders${query}`, { method, headers: { Authorization: `Bearer ${pass}`, 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });
  const type = r.headers.get('content-type') || '';
  const res = type.includes('json') ? await r.json() : { error: 'The order API is not reachable. Is the site running on Cloudflare?' };
  if (r.status === 401) { logout(); throw new Error(res.error); }
  if (!r.ok) throw new Error(res.error || `Error ${r.status}`);
  return res;
}

async function load() {
  const q = $('[data-q]').value.trim();
  const st = $('[data-filter]').value;
  const params = new URLSearchParams({ ...(q && { q }), ...(st && { status: st }) });
  try {
    ({ orders } = await api('GET', params.size ? `?${params}` : ''));
    say($('[data-app-status]'), `${orders.length} order(s)`, true);
    render();
  } catch (e) { say($('[data-app-status]'), e.message); }
}

function render() {
  $('[data-list]').replaceChildren(...orders.map((o) => {
    const b = el('button');
    b.type = 'button';
    const top = el('span', 'top');
    top.append(el('b', '', o.id), el('span', 'badge-status', S[o.status]?.label || o.status));
    b.append(top, el('span', '', [o.name, o.phone, o.email].filter(Boolean).join(' · ') || '—'), el('span', 'muted', `${o.items || ''} ${o.total ? `· ${o.total}` : ''}`.trim()), el('small', 'muted', `Updated ${when(o.updated_at)}`));
    b.addEventListener('click', () => edit(o));
    const li = el('li');
    li.append(b);
    return li;
  }));
}

function edit(o = {}) {
  f.reset();
  for (const k of ['id', 'status', 'note', 'name', 'phone', 'email', 'items', 'total', 'method']) if (o[k] != null) f.elements[k].value = o[k];
  f.elements.id.readOnly = !!o.id;
  $('[data-edit-title]').textContent = o.id ? `Order ${o.id}` : 'New order';
  $('[data-delete]').hidden = !o.id;
  const hist = $('[data-edit-history]');
  hist.replaceChildren(...(o.history || []).slice().reverse().map((h) => {
    const li = el('li');
    li.append(el('b', '', S[h.status]?.label || h.status), el('time', '', when(h.at)));
    if (h.note) li.append(el('span', 'muted', h.note));
    return li;
  }));
  if (o.id) {
    // Tracking link to send to the buyer (on WhatsApp when the phone is known)
    const link = `${D.site}/track/?id=${encodeURIComponent(o.id)}`;
    const p = el('li');
    const a = el('a', '', `${D.linkLabel}: ${link}`);
    a.href = link;
    a.target = '_blank';
    p.append(a);
    const phone = (o.phone || '').replace(/\D/g, '');
    if (phone.length > 6) {
      const wa = el('a', 'btn btn-outline btn-sm', 'Send the link on WhatsApp');
      wa.href = `https://wa.me/${phone}?text=${encodeURIComponent(`${D.linkLabel} ${o.id}: ${link}`)}`;
      wa.target = '_blank';
      p.append(document.createElement('br'), wa);
    }
    hist.prepend(p);
  }
  dlg.showModal();
}

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(f));
  try {
    const { id } = await api('POST', '', data);
    dlg.close();
    say($('[data-app-status]'), `Saved ${id}`, true);
    load();
  } catch (err) { alert(err.message); }
});
$('[data-delete]').addEventListener('click', async () => {
  const id = f.elements.id.value;
  if (!confirm(`Delete order ${id}? This cannot be undone.`)) return;
  try { await api('DELETE', `?id=${encodeURIComponent(id)}`); dlg.close(); load(); } catch (err) { alert(err.message); }
});
$('[data-close]').addEventListener('click', () => dlg.close());
$('[data-new]').addEventListener('click', () => edit());
let timer;
$('[data-q]').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
$('[data-filter]').addEventListener('change', load);

function logout() {
  pass = '';
  sessionStorage.removeItem('ordersPass');
  $('[data-app]').hidden = true;
  $('[data-login]').hidden = false;
}
$('[data-logout]').addEventListener('click', logout);
$('[data-login]').addEventListener('submit', async (e) => {
  e.preventDefault();
  pass = e.target.password.value;
  try {
    await api('GET', '?status=__none__');
    sessionStorage.setItem('ordersPass', pass);
    start();
  } catch (err) { say($('[data-login-status]'), err.message); }
});
function start() {
  $('[data-login]').hidden = true;
  $('[data-app]').hidden = false;
  load();
}
if (pass) start();
