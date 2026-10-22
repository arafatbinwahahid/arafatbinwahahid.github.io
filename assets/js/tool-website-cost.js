// Website cost calculator (/tools/website-cost-calculator/). Packages come from the linked service, extras and texts
// from data/collections/tools.json, rates from data/global/rates.json; everything is written into #tool-data at build time.
const tool = document.querySelector('[data-calc]');
const D = JSON.parse(document.getElementById('tool-data').textContent);
const L = D.labels;
const R = Object.fromEntries(D.rates.map((c) => [c.code, c]));
const curSel = tool.querySelector('[data-calc-currency]');
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
const fmt = (n, code) => {
  const c = R[code];
  return new Intl.NumberFormat(c.lakh ? 'en-IN' : 'en-US', { style: 'currency', currency: code, minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }).format(n);
};
// Prices are set in the service's currency; others go through USD (rates = units per 1 USD)
const inCur = (n, code) => (n / R[D.base].rate) * R[code].rate;

function update() {
  const pk = D.packages[tool.querySelector('input[name="pkg"]:checked')?.value || 0];
  const lines = [[pk.name, pk.price]];
  for (const x of D.extras) {
    const el = tool.querySelector(`[data-extra="${x.id}"]`);
    let qty = el.type === 'checkbox' ? Number(el.checked) : Math.floor(Number(el.value) || 0);
    if (el.type !== 'checkbox') {
      qty = Math.min(Math.max(qty, 0), x.max || 99);
      if (el.value !== '' && Number(el.value) !== qty) el.value = qty;
    }
    if (qty) lines.push([x.unit ? `${x.name} × ${qty}` : x.name, x.price * qty]);
  }
  const code = curSel.value;
  const total = lines.reduce((n, [, p]) => n + p, 0);
  tool.querySelector('[data-calc-lines]').replaceChildren(...lines.map(([name, price]) => {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('span'), { textContent: name }), Object.assign(document.createElement('b'), { textContent: fmt(inCur(price, code), code) }));
    return li;
  }));
  tool.querySelector('[data-calc-total]').textContent = fmt(inCur(total, code), code);
  const text = fill(L.whatsappMessage, { package: pk.name, extras: lines.slice(1).map(([n]) => n).join(', ') || L.noExtras, total: fmt(inCur(total, code), code) });
  tool.querySelector('[data-calc-wa]').href = `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(text)}`;
}

tool.addEventListener('input', update);
tool.addEventListener('change', update);
update();
