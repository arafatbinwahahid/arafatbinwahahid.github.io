// Cart, currency, gallery, quantity and checkout. Loaded on the shop and payment pages only.
// Prices and stock always come from the #catalog data written at build time, never from saved browser data.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const C = JSON.parse($('#catalog').textContent);
const T = C.text;
const byId = Object.fromEntries(C.products.map((p) => [p.id, p]));
const store = {
  get(k, fallback, area = localStorage) { try { return JSON.parse(area.getItem(k)) ?? fallback; } catch { return fallback; } },
  set(k, v, area = localStorage) { try { area.setItem(k, JSON.stringify(v)); } catch {} },
};
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');

// ---- Currency ----
let currency = store.get('currency', C.defaultCurrency);
if (!C.currencies.includes(currency)) currency = C.defaultCurrency;
const fmt = (code) => new Intl.NumberFormat(C.locale, { style: 'currency', currency: code });
const money = (n) => fmt(currency).format(n);
const round = (n) => { const d = fmt(currency).resolvedOptions().maximumFractionDigits; return Math.round(n * 10 ** d) / 10 ** d; };

// ---- Cart: [{ id, qty }] checked against the catalog every time it is read ----
let stockChanged = false;
function loadCart() {
  const items = [];
  for (const it of store.get('cart', [])) {
    const p = byId[it?.id];
    const qty = Math.min(Math.floor(Number(it?.qty)) || 0, p ? p.stock : 0);
    if (qty !== it?.qty) stockChanged = true;
    if (!p || qty < 1 || items.some((x) => x.id === p.id)) continue;
    items.push({ id: p.id, qty });
  }
  if (stockChanged) store.set('cart', items);
  return items;
}
let cart = loadCart();
const save = () => { store.set('cart', cart); render(); };
const qtyOf = (id) => cart.find((x) => x.id === id)?.qty || 0;
const name = (p) => (p.option ? `${p.title} (${p.option})` : p.title);
const lines = () => cart.map((it) => { const p = byId[it.id]; const unit = p.prices[currency]; return { ...it, p, unit, total: round(unit * it.qty) }; });
const total = () => round(lines().reduce((sum, l) => sum + l.total, 0));

function setQty(id, qty) {
  const p = byId[id];
  qty = Math.max(0, Math.min(Math.floor(qty) || 0, p.stock));
  cart = qty ? (qtyOf(id) ? cart.map((x) => (x.id === id ? { id, qty } : x)) : [...cart, { id, qty }]) : cart.filter((x) => x.id !== id);
  save();
}

// Adds up to the stock that is left; returns how many were added
function addToCart(id, qty) {
  const room = byId[id].stock - qtyOf(id);
  const add = Math.max(0, Math.min(qty, room));
  if (add) setQty(id, qtyOf(id) + add);
  return add;
}

// ---- Drawer ----
const drawer = $('#cart');
const openCart = () => { render(); drawer.showModal(); };
$$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
$$('[data-cart-close]').forEach((b) => b.addEventListener('click', () => drawer.close()));
drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });
$('[data-checkout]').addEventListener('click', (e) => { if (!cart.length) e.preventDefault(); });

function cartRow(l) {
  const li = document.createElement('li');
  li.className = 'cart-item';
  li.innerHTML = `<img alt="" width="56" height="56" loading="lazy"><div><a></a><span class="muted" data-option></span><span class="muted"></span>
<div class="qty qty-sm"><button type="button" data-step="-1"></button><input type="number" inputmode="numeric" min="1"><button type="button" data-step="1"></button></div></div>
<div class="cart-item-end"><b></b><button type="button" class="icon-btn" data-remove></button></div>`;
  const [img, link, unit, input, total] = [$('img', li), $('a', li), $('.muted:not([data-option])', li), $('input', li), $('b', li)];
  $('[data-option]', li).textContent = l.p.option;
  $('[data-option]', li).hidden = !l.p.option;
  img.src = l.p.image;
  link.href = `/shop/${l.p.slug}/`;
  link.textContent = l.p.title;
  unit.textContent = `${money(l.unit)} × ${l.qty}`;
  input.value = l.qty;
  input.max = l.p.stock;
  input.setAttribute('aria-label', `${T.title}: ${l.p.title}`);
  total.textContent = money(l.total);
  $('[data-step="-1"]', li).setAttribute('aria-label', T.decreaseLabel);
  $('[data-step="1"]', li).setAttribute('aria-label', T.increaseLabel);
  $('[data-remove]', li).setAttribute('aria-label', `${T.removeLabel}: ${l.p.title}`);
  $('[data-step="-1"]', li).innerHTML = '&minus;';
  $('[data-step="1"]', li).textContent = '+';
  $('[data-remove]', li).textContent = '×';
  $$('[data-step]', li).forEach((b) => b.addEventListener('click', () => setQty(l.id, l.qty + Number(b.dataset.step))));
  input.addEventListener('change', () => setQty(l.id, Number(input.value)));
  $('[data-remove]', li).addEventListener('click', () => setQty(l.id, 0));
  return li;
}

// ---- Render everything that depends on the cart or currency ----
function render() {
  $$('[data-prices]').forEach((n) => { const v = JSON.parse(n.dataset.prices)[currency]; if (v != null) n.textContent = money(v); });
  $$('[data-currency-select]').forEach((s) => { s.value = currency; });
  const count = cart.reduce((n, x) => n + x.qty, 0);
  $$('[data-cart-count]').forEach((b) => { b.textContent = count; b.hidden = !count; });
  $('[data-cart-list]').replaceChildren(...lines().map(cartRow));
  $('[data-cart-empty]').hidden = cart.length > 0;
  $('[data-checkout]').toggleAttribute('aria-disabled', !cart.length);
  $$('[data-cart-total]').forEach((n) => { n.textContent = money(total()); });
  $$('[data-buy]').forEach(renderBuy);
  if (pay) renderPayment();
}

$$('[data-currency-select]').forEach((s) => s.addEventListener('change', () => { currency = s.value; store.set('currency', currency); render(); }));

// ---- Shop page: category filter + add buttons ----
$$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
  $$('[data-filter]').forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', c === chip); });
  $$('#products [data-cat]').forEach((card) => { card.hidden = chip.dataset.filter !== 'all' && card.dataset.cat !== chip.dataset.filter; });
}));

$$('[data-add]').forEach((b) => b.addEventListener('click', () => {
  const box = b.closest('[data-buy]');
  const wanted = box ? Number($('[data-qty]', box).value) || 1 : 1;
  const added = addToCart(b.dataset.add, wanted);
  if (box && added < wanted) $('[data-buy-status]', box).textContent = fill(T.maxStock, { n: byId[b.dataset.add].stock });
  if (added) openCart();
}));

// ---- Product page: quantity selector limited to the stock that is left ----
function renderBuy(box) {
  const p = byId[box.dataset.buy];
  const input = $('[data-qty]', box);
  if (!input) return;
  const room = p.stock - qtyOf(p.id);
  input.max = Math.max(room, 1);
  input.value = Math.min(Math.max(Number(input.value) || 1, 1), Math.max(room, 1));
  $('[data-add]', box).disabled = room < 1;
  const st = $('[data-stock-text]', box);
  st.textContent = p.stock > 0 ? fill(T.stock, { n: p.stock }) : T.soldOut;
  st.classList.toggle('stock-out', p.stock < 1);
  $('[data-buy-status]', box).textContent = room < 1 ? fill(T.maxStock, { n: p.stock }) : '';
}
$$('[data-buy]').forEach((box) => {
  const input = $('[data-qty]', box);
  $$('[data-plan]', box).forEach((r) => r.addEventListener('change', () => {
    box.dataset.buy = r.value;
    $('[data-add]', box).dataset.add = r.value;
    $('[data-main-price] [data-prices]', box).dataset.prices = r.dataset.plan;
    $('[data-main-price] s', box)?.remove();
    input.value = 1;
    render();
  }));
  $$('[data-step]', box).forEach((b) => b.addEventListener('click', () => { input.value = Number(input.value) + Number(b.dataset.step); renderBuy(box); }));
  input?.addEventListener('change', () => renderBuy(box));
});

// ---- Product gallery ----
$$('[data-thumb]').forEach((t) => t.addEventListener('click', () => {
  $$('[data-slide]').forEach((s) => { s.hidden = s.dataset.slide !== t.dataset.thumb; });
  $$('[data-thumb]').forEach((x) => x.toggleAttribute('aria-current', x === t));
}));

// ---- Payment page ----
const pay = $('[data-pay-main]');
let method = {};
let sending = false;

function orderId() {
  const sig = JSON.stringify(cart);
  const saved = store.get('order', {}, sessionStorage);
  if (saved.sig === sig && saved.id) return saved.id;
  const d = new Date();
  const id = `${T.orderPrefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  store.set('order', { sig, id }, sessionStorage);
  return id;
}

function renderPayment() {
  const empty = !cart.length;
  const done = !$('[data-pay-done]').hidden;
  $('[data-pay-empty]').hidden = !empty || done;
  if (done) { pay.hidden = true; return; }
  pay.hidden = empty;
  if (empty) return;
  $('[data-order-id]').textContent = orderId();
  $('[data-stock-notice]').hidden = !stockChanged;
  $('[data-summary]').replaceChildren(...lines().map((l) => {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><b></b>';
    li.firstChild.textContent = `${name(l.p)} × ${l.qty}`;
    li.lastChild.textContent = money(l.total);
    return li;
  }));
  $$('input[name="currency"]').forEach((r) => { r.checked = r.value === currency; });
  $$('[data-methods]').forEach((f) => { f.hidden = f.dataset.methods !== currency; });
  const radios = $$(`input[name="method-${currency}"]`);
  if (!radios.some((r) => r.value === method[currency]) && radios[0]) method[currency] = radios[0].value;
  radios.forEach((r) => { r.checked = r.value === method[currency]; });
  $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== method[currency]; });
  $$('[data-amount]').forEach((a) => { if (!a.dataset.touched) a.value = total(); });
  $$('[data-panel]:not([hidden]) [data-paypal]').forEach(paypalButtons);
}

// ---- PayPal / card buttons (payments.json "paypalClientId"); the PayPal script loads only when its panel is open ----
let paypalSdk = null;
function paypalButtons(box) {
  if (box.dataset.ready) return;
  box.dataset.ready = '1';
  const form = $('[data-pay-form]', box.closest('[data-panel]'));
  const P = T.paypal;
  const say = (text, ok) => { const s = $('.status', form); s.textContent = text; s.className = `status ${ok ? 'ok' : 'err'}`; };
  const code = box.dataset.currency;
  paypalSdk ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(box.dataset.paypal)}&currency=${code}&intent=capture&components=buttons`;
    s.onload = () => resolve(window.paypal);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  paypalSdk.then((paypal) => paypal.Buttons({
    style: { layout: 'vertical', shape: 'rect', label: 'pay' },
    onClick: (data, actions) => {
      const v = (n) => form.elements[n]?.value.trim() || '';
      cart = loadCart();
      if (!cart.length) { say(T.pay.emptyCart); return actions.reject(); }
      if (store.get('sentOrders', []).includes(orderId())) { say(fill(T.pay.duplicate, { id: orderId() })); return actions.reject(); }
      if (!v('name') || !v('email') || !/^\+?[0-9 ()-]{7,20}$/.test(v('mobile'))) { say(P.missing); form.reportValidity(); return actions.reject(); }
      say('');
      return actions.resolve();
    },
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{
        custom_id: orderId(),
        description: lines().map((l) => `${name(l.p)} x${l.qty}`).join(', ').slice(0, 127),
        amount: { currency_code: code, value: total().toFixed(2) },
      }],
    }),
    onApprove: async (data, actions) => {
      const order = await actions.order.capture();
      const cap = order.purchase_units?.[0]?.payments?.captures?.[0] || {};
      await submitOrder(form, {
        'PayPal order ID': order.id,
        'PayPal capture ID': cap.id || '',
        'PayPal status': `${order.status}${cap.status ? ` / ${cap.status}` : ''}`,
        'PayPal amount': `${cap.amount?.value || ''} ${cap.amount?.currency_code || ''}`.trim(),
        'PayPal payer': `${order.payer?.name?.given_name || ''} ${order.payer?.name?.surname || ''} <${order.payer?.email_address || ''}>`.trim(),
      });
    },
    onError: () => say(fill(P.error, { id: orderId() })),
  }).render(box)).catch(() => { box.hidden = true; });
}

if (pay) {
  $$('input[name="currency"]').forEach((r) => r.addEventListener('change', () => { currency = r.value; store.set('currency', currency); render(); }));
  $$('[data-methods] input').forEach((r) => r.addEventListener('change', () => { method[currency] = r.value; render(); }));
  $$('[data-amount]').forEach((a) => a.addEventListener('input', () => { a.dataset.touched = '1'; }));
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $$('[data-date]').forEach((d) => { d.min = today; });
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.lastChild.textContent = T.copied; setTimeout(() => { b.lastChild.textContent = T.copy; }, 1500); } catch {}
  }));
  $$('[data-pay-form]').forEach((form) => form.addEventListener('submit', (e) => { e.preventDefault(); submitOrder(form); }));
}

// paypal: details of a payment made with the PayPal buttons (the amount check then uses PayPal's amount)
async function submitOrder(form, paypal) {
  const F = T.pay;
  const status = $('.status', form);
  const say = (text, ok) => { status.textContent = text; status.className = `status ${ok ? 'ok' : 'err'}`; };
  if (sending || form.botcheck.checked) return;
  cart = loadCart(); // check stock again right before sending
  if (!cart.length) return say(F.emptyCart);
  const id = orderId();
  const sent = store.get('sentOrders', []);
  if (sent.includes(id)) return say(fill(F.duplicate, { id }));
  const v = (name) => form.elements[name]?.value.trim() || '';
  if (!/^\+?[0-9 ()-]{7,20}$/.test(v('mobile'))) return say(F.invalidPhone);
  const appointment = form.dataset.type === 'appointment';
  if (!appointment && !paypal && !(Number(v('amount')) > 0)) return say(F.invalidAmount);
  if (appointment) {
    if (v('date') < form.elements.date.min) return say(F.invalidDate);
    const t = form.elements.time;
    if ((t.min && v('time') < t.min) || (t.max && v('time') > t.max)) return say(F.invalidTime);
  }

  const items = lines();
  const sum = total();
  const now = new Date();
  const data = {
    subject: `${appointment ? 'Appointment request' : paypal ? 'PAID with PayPal' : 'Payment confirmation'} ${id}: ${form.dataset.method} (${currency}) ${money(sum)}`,
    'Order ID': id,
    Status: paypal ? 'Paid with PayPal: check the payment in your PayPal account before delivering' : 'Pending: payment not verified yet',
    name: v('name'),
    'Mobile number': v('mobile'),
    email: v('email'),
    'Payment method': form.dataset.method,
    Currency: currency,
    Items: items.map((l, i) => `${i + 1}. ${name(l.p)} (ID ${l.id}) × ${l.qty} @ ${money(l.unit)} = ${money(l.total)}`).join('\n'),
    'Order total': money(sum),
    'Submitted at': `${now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'long' })} (${now.toISOString()})`,
    Page: location.href,
  };
  if (appointment) {
    data['Preferred visit date'] = v('date');
    data['Preferred visit time'] = v('time');
    if (v('message')) data.Message = v('message');
  } else if (paypal) {
    Object.assign(data, paypal);
    if (Number(paypal['PayPal amount'].split(' ')[0]) !== sum) data['Amount check'] = `PayPal amount differs from the order total ${money(sum)}`;
  } else {
    data['Amount paid (entered by customer)'] = `${v('amount')} ${currency}`;
    if (Number(v('amount')) !== sum) data['Amount check'] = `Entered amount differs from the order total ${money(sum)}`;
    if (v('transaction')) data['Transaction / reference'] = v('transaction');
  }

  sending = true;
  const button = $('[type=submit]', form);
  button.disabled = true;
  say(F.sending, true);
  try {
    await window.sendToWeb3Forms(data);
    store.set('sentOrders', [...sent, id].slice(-20));
    $('[data-pay-done]').hidden = false;
    cart = [];
    save();
    $('[data-done-text]').textContent = fill(appointment ? T.done.appointment : paypal ? T.done.paypal : T.done.payment, { id });
    $('[data-pay-done]').scrollIntoView();
  } catch {
    say(fill(F.error, { id }));
  }
  sending = false;
  button.disabled = false;
}

render();
