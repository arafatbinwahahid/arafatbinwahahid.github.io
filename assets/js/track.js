const form = document.querySelector('[data-track]');
const out = document.querySelector('[data-track-result]');
const D = JSON.parse(document.getElementById('track-data').textContent);
const L = D.labels;
const S = Object.fromEntries(D.statuses.map((s) => [s.id, s]));
const flow = D.statuses.filter((s) => s.id !== 'cancelled');
const status = form.querySelector('[data-track-status]');
const say = (text, ok) => { status.textContent = text; status.className = `status ${ok ? 'ok' : 'err'}`; };
const when = (iso) => new Date(iso).toLocaleString(D.locale, { dateStyle: 'medium', timeStyle: 'short' });
const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text != null ? { textContent: text } : {});
function show(o) {
const s = S[o.status] || { label: o.status, text: '', icon: '' };
const now = el('div', `track-now is-${o.status}`);
now.innerHTML = s.icon;
const txt = el('div');
txt.append(el('small', 'muted', L.statusLabel), el('b', '', s.label), el('span', '', s.text));
now.append(txt);
const bar = el('ol', 'steps-bar');
const at = flow.findIndex((x) => x.id === o.status);
bar.style.setProperty('--n', flow.length);
bar.setAttribute('aria-hidden', 'true');
flow.forEach((x, i) => bar.append(el('li', o.status !== 'cancelled' && i <= at ? 'on' : '')));
const facts = el('dl', 'track-facts');
for (const [label, value] of [['ID', o.id], [L.itemsLabel, o.items], [L.totalLabel, o.total], [L.noteLabel, o.note], [L.updatedLabel, when(o.updatedAt)]]) {
if (!value) continue;
const row = el('div');
row.append(el('dt', '', label), el('dd', '', value));
facts.append(row);
}
const hist = el('ol', 'history');
[...o.history].reverse().forEach((h) => {
const li = el('li');
li.append(el('b', '', (S[h.status] || { label: h.status }).label), el('time', '', when(h.at)));
if (h.note) li.append(el('span', 'muted', h.note));
hist.append(li);
});
out.replaceChildren(now, bar, facts, el('h2', 'h3', L.historyTitle), hist);
out.hidden = false;
}
async function lookUp() {
const id = form.elements.id.value.trim().toUpperCase();
const check = form.elements.check.value.trim();
if (!id || !check) return;
say(L.loading, true);
out.hidden = true;
try {
const r = await fetch(`/api/track?id=${encodeURIComponent(id)}&check=${encodeURIComponent(check)}`, { headers: { Accept: 'application/json' } });
const type = r.headers.get('content-type') || '';
if (!type.includes('json')) return say(L.unavailable);
if (r.status === 404) return say(L.notFound);
if (r.status === 429) return say(L.tooMany);
if (!r.ok) return say(L.unavailable);
say('');
show(await r.json());
history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
} catch {
say(L.unavailable);
}
}
form.addEventListener('submit', (e) => { e.preventDefault(); lookUp(); });
const fromLink = new URLSearchParams(location.search).get('id');
if (fromLink) { form.elements.id.value = fromLink; form.elements.check.focus(); }