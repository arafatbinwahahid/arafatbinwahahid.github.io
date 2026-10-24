const list = document.querySelector('.packages[data-service]');
const D = list.dataset;
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const feeOf = (box, price) => (box.dataset.fees && window.payPalFee ? window.payPalFee(price, JSON.parse(box.dataset.fees)) : 0);
const newId = () => {
const d = new Date();
return `${D.orderPrefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};
list.querySelectorAll('[data-pay-open]').forEach((button) => {
const box = button.closest('li').querySelector('.paypal-box');
const price = Number(box.dataset.price);
const fee = feeOf(box, price);
if (fee) button.lastChild.textContent = fill(D.paylabelfee, { total: fmt(price + fee), fee: fmt(fee), price: fmt(price) });
});
list.querySelectorAll('[data-pay-open]').forEach((button) => button.addEventListener('click', () => {
const box = button.closest('li').querySelector('.paypal-box');
box.hidden = !box.hidden;
button.setAttribute('aria-expanded', !box.hidden);
if (box.hidden) return;
const say = (text, ok) => { const s = box.querySelector('.status'); s.textContent = text; s.className = `status ${ok ? 'ok' : 'err'}`; };
const pk = box.dataset;
const price = Number(pk.price);
const fee = feeOf(box, price);
const id = newId();
window.payPalButtons(box.querySelector('[data-paypal]'), {
order: () => ({ id, items: [{ name: `${D.service}: ${pk.package}`, sku: pk.sku, qty: 1, unit: price }], fee, feeLabel: pk.feeLabel }),
paid: async (info) => {
const now = new Date();
const data = {
subject: `PAID with PayPal ${id}: ${D.service} – ${pk.package} (USD ${price.toFixed(2)})`,
'Order ID': id,
Status: 'Paid with PayPal: check the payment in your PayPal account before starting',
name: info.name,
email: info.email,
Service: D.service,
Package: pk.package,
'Package price': `USD ${price.toFixed(2)}`,
...(fee && { 'PayPal fee added': `USD ${fee.toFixed(2)}`, 'Buyer paid (price + fee)': `USD ${(price + fee).toFixed(2)}` }),
...info.fields,
'Submitted at': `${now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'long' })} (${now.toISOString()})`,
Page: location.href,
};
if (Math.abs(info.amount - (price + fee)) > 0.001) data['Amount check'] = `PayPal amount differs from the price USD ${(price + fee).toFixed(2)}`;
try {
const track = await window.saveOrder({ id, name: info.name, email: info.email, method: 'PayPal (USD)', total: `USD ${(price + fee).toFixed(2)}`, items: `${D.service}: ${pk.package}` });
if (track) data['Tracking link'] = track;
await window.sendToWeb3Forms(data);
box.dataset.track = track;
} catch {
return say(fill(D.senderror, { id }));
}
const wa = `https://wa.me/${D.wa}?text=${encodeURIComponent(fill(D.donewhatsapp, { service: D.service, package: pk.package, id }))}`;
const track = box.dataset.track;
box.innerHTML = `<h4></h4><p></p><p class="btns"><a class="btn btn-primary btn-sm" target="_blank" rel="noopener">WhatsApp</a>${track ? '<a class="btn btn-outline btn-sm"></a>' : ''}</p>`;
box.querySelector('h4').textContent = D.donetitle;
box.querySelector('p').textContent = fill(D.donetext, { id });
box.querySelector('a').href = wa;
if (track) Object.assign(box.querySelectorAll('a')[1], { href: track, textContent: D.tracklabel });
button.hidden = true;
},
error: () => say(D.error),
hide: () => { box.querySelector('[data-paypal]').hidden = true; box.querySelector('[data-paypal-fallback]').hidden = false; },
});
}));