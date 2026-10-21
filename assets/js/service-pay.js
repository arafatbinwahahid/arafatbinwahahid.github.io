// "Pay with PayPal or card" on service pages: opens the PayPal buttons under a package (code in paypal.js),
// then sends the order to Web3Forms like the shop checkout does.
const list = document.querySelector('.packages[data-service]');
const D = list.dataset;
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
const newId = () => {
  const d = new Date();
  return `${D.orderPrefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

list.querySelectorAll('[data-pay-open]').forEach((button) => button.addEventListener('click', () => {
  const box = button.closest('li').querySelector('.paypal-box');
  box.hidden = !box.hidden;
  button.setAttribute('aria-expanded', !box.hidden);
  if (box.hidden) return;
  const say = (text, ok) => { const s = box.querySelector('.status'); s.textContent = text; s.className = `status ${ok ? 'ok' : 'err'}`; };
  const pk = box.dataset;
  const price = Number(pk.price);
  const id = newId();
  window.payPalButtons(box.querySelector('[data-paypal]'), {
    order: () => ({ id, items: [{ name: `${D.service}: ${pk.package}`, sku: pk.sku, qty: 1, unit: price }] }),
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
        ...info.fields,
        'Submitted at': `${now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'long' })} (${now.toISOString()})`,
        Page: location.href,
      };
      if (info.amount !== price) data['Amount check'] = `PayPal amount differs from the package price USD ${price.toFixed(2)}`;
      try {
        await window.sendToWeb3Forms(data);
      } catch {
        return say(fill(D.senderror, { id }));
      }
      const wa = `https://wa.me/${D.wa}?text=${encodeURIComponent(fill(D.donewhatsapp, { service: D.service, package: pk.package, id }))}`;
      box.innerHTML = '<h4></h4><p></p><p><a class="btn btn-primary btn-sm" target="_blank" rel="noopener">WhatsApp</a></p>';
      box.querySelector('h4').textContent = D.donetitle;
      box.querySelector('p').textContent = fill(D.donetext, { id });
      box.querySelector('a').href = wa;
      button.hidden = true;
    },
    error: () => say(D.error),
    hide: () => { box.querySelector('[data-paypal]').hidden = true; box.querySelector('[data-paypal-fallback]').hidden = false; },
  });
}));
