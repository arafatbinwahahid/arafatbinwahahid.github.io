const tool = document.querySelector('[data-conv]');
const D = JSON.parse(document.getElementById('tool-data').textContent);
const R = Object.fromEntries(D.rates.map((c) => [c.code, c]));
const $ = (s) => tool.querySelector(s);
const amountEl = $('[data-conv-amount]');
const fromEl = $('[data-conv-from]');
const toEl = $('[data-conv-to]');
const ownEl = $('[data-conv-own]');
const bnEl = $('[data-conv-bn]');
const BN = '০১২৩৪৫৬৭৮৯';
const digits = (s) => (bnEl.checked ? s.replace(/\d/g, (d) => BN[d]) : s);
const formats = {};
const fmt = (n, code) => {
const c = R[code];
formats[code] ||= new Intl.NumberFormat(c.lakh ? 'en-IN' : 'en-US', { style: 'currency', currency: code, minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
return formats[code].format(n);
};
const fmtRate = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: n < 1 ? 6 : 4 }).format(n);
const convert = (n, from, to) => (n / R[from].rate) * R[to].rate;
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under1000(n) {
const out = [];
if (n >= 100) { out.push(`${ONES[Math.floor(n / 100)]} hundred`); n %= 100; }
if (n >= 20) out.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
else if (n) out.push(ONES[n]);
return out.join(' ');
}
function intWords(n, lakh) {
if (!n) return 'zero';
const scale = lakh ? [[1e7, 'crore'], [1e5, 'lakh'], [1e3, 'thousand']] : [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
const out = [];
for (const [v, name] of scale) {
if (n >= v) {
const q = Math.floor(n / v);
out.push(`${q >= 1000 ? intWords(q, lakh) : under1000(q)} ${name}`);
n %= v;
}
}
if (n) out.push(under1000(n));
return out.join(' ');
}
function words(amount, c) {
const d = c.decimals;
if (!c.unit || !(amount >= 0) || amount * 10 ** d > Number.MAX_SAFE_INTEGER) return '';
const [w, f = ''] = new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false }).format(amount).split('.');
const whole = Number(w);
const part = Number(f) ? Math.round((Number(f) / 10 ** d) * (c.subunitPer || 10 ** d)) : 0;
const sub = part === 1 ? c.subunit || c.subunits : c.subunits || c.subunit;
const rest = part ? (sub ? ` and ${intWords(part, c.lakh)} ${sub}` : ` and ${f}/${10 ** d}`) : '';
const text = `${intWords(whole, c.lakh)} ${whole === 1 ? c.unit : c.units || c.unit}${rest} only`;
return text.charAt(0).toUpperCase() + text.slice(1);
}
function update() {
const a = Math.max(0, Number(amountEl.value) || 0);
const from = fromEl.value;
const to = toEl.value;
const own = Number(ownEl.value);
const r = own > 0 ? own : convert(1, from, to);
const out = own > 0 ? a * own : convert(a, from, to);
$('[data-conv-in]').textContent = digits(`${fmt(a, from)} =`);
$('[data-conv-out]').textContent = digits(fmt(out, to));
$('[data-conv-rate]').textContent = digits(`1 ${from} = ${fmtRate(r)} ${to} · 1 ${to} = ${fmtRate(1 / r)} ${from}`);
const w = a ? words(out, R[to]) : '';
$('[data-conv-words]').textContent = w;
$('[data-conv-words-row]').hidden = !w;
$('[data-conv-own-from]').textContent = `1 ${from} =`;
$('[data-conv-own-to]').textContent = to;
$('[data-conv-all]').replaceChildren(...D.rates.filter((c) => c.code !== from).map((c) => {
const li = document.createElement('li');
li.append(Object.assign(document.createElement('span'), { textContent: c.name }), Object.assign(document.createElement('b'), { textContent: digits(fmt(c.code === to ? out : convert(a, from, c.code), c.code)) }));
return li;
}));
}
const pairChanged = () => { ownEl.value = ''; update(); };
amountEl.addEventListener('input', update);
ownEl.addEventListener('input', update);
bnEl.addEventListener('change', update);
fromEl.addEventListener('change', pairChanged);
toEl.addEventListener('change', pairChanged);
$('[data-conv-swap]').addEventListener('click', () => { [fromEl.value, toEl.value] = [toEl.value, fromEl.value]; pairChanged(); });
update();