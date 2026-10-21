// PayPal / card buttons, used by the payment page (shop.js) and the service pages (service-pay.js).
// PayPal's own script loads only the first time buttons are shown.
//   window.payPalButtons(box, { order, check, paid, error, hide })
//   box: element with data-paypal="<Client ID>" and data-currency="USD"
//   order(): { id, items: [{ name, sku, qty, unit }] }   check(): false stops the payment before PayPal opens
//   paid(info): runs after the money is captured        hide(): PayPal could not load
(() => {
  let sdk = null;
  const load = (clientId, currency) => (sdk ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons`;
    s.onload = () => resolve(window.paypal);
    s.onerror = reject;
    document.head.appendChild(s);
  }));
  const money = (code, cents) => ({ currency_code: code, value: (cents / 100).toFixed(2) });

  window.payPalButtons = (box, { order, check = () => true, paid, error, hide }) => {
    if (box.dataset.ready) return;
    box.dataset.ready = '1';
    const code = box.dataset.currency;
    // No buttons after 15 s (blocked script, wrong Client ID) counts as a failure too
    const timer = setTimeout(() => { if (!box.querySelector('iframe')) hide(); }, 15000);
    load(box.dataset.paypal, code).then((paypal) => {
      if (!paypal?.Buttons) throw new Error('PayPal not loaded');
      return paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', label: 'pay' },
        onClick: (data, actions) => (check() === false ? actions.reject() : actions.resolve()),
        // The order ID (as Invoice ID) and every line show in your PayPal activity and in both PayPal receipts
        createOrder: (data, actions) => {
          const o = order();
          const total = o.items.reduce((n, i) => n + Math.round(i.unit * 100) * i.qty, 0);
          return actions.order.create({
            purchase_units: [{
              invoice_id: o.id,
              custom_id: o.id,
              description: `Order ${o.id}: ${o.items.map((i) => `${i.name} x${i.qty}`).join(', ')}`.slice(0, 127),
              amount: { ...money(code, total), breakdown: { item_total: money(code, total) } },
              items: o.items.map((i) => ({ name: i.name.slice(0, 127), sku: i.sku, quantity: String(i.qty), unit_amount: money(code, Math.round(i.unit * 100)), category: 'DIGITAL_GOODS' })),
            }],
          });
        },
        onApprove: async (data, actions) => {
          const o = await actions.order.capture();
          const cap = o.purchase_units?.[0]?.payments?.captures?.[0] || {};
          const name = `${o.payer?.name?.given_name || ''} ${o.payer?.name?.surname || ''}`.trim();
          const email = o.payer?.email_address || '';
          await paid({
            name, email, amount: Number(cap.amount?.value || 0),
            fields: {
              'PayPal order ID': o.id,
              'PayPal capture ID': cap.id || '',
              'PayPal status': `${o.status}${cap.status ? ` / ${cap.status}` : ''}`,
              'PayPal amount': `${cap.amount?.value || ''} ${cap.amount?.currency_code || ''}`.trim(),
              'PayPal payer': `${name} <${email}>`,
            },
          });
        },
        onError: () => error(),
      }).render(box);
    }).catch(() => { clearTimeout(timer); hide(); });
  };
})();
