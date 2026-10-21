// PayPal / card buttons, used by the payment page (shop.js) and the service pages (service-pay.js).
// PayPal's own script loads only the first time buttons are shown.
//   window.payPalButtons(box, { order, check, paid, error, hide })
//   box: element with data-paypal="<Client ID>" and data-currency="USD"
//   order(): { id, items: [{ name, sku, qty, unit }], fee }   check(): false stops the payment before PayPal opens
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

  // PayPal fee to add on top of a price so the full price reaches you (payments.json → PayPal → "fees"):
  // PayPal keeps percent + international percent + fixed, and conversionPercent is lost when you withdraw in another currency.
  // gross = (price ÷ (1 − conversion) + fixed) ÷ (1 − percent), rounded up to the cent.
  window.payPalFee = (price, f) => {
    if (!f) return 0;
    const p = ((f.percent || 0) + (f.internationalPercent || 0)) / 100;
    const c = (f.conversionPercent || 0) / 100;
    if (!p && !c && !f.fixed) return 0;
    const gross = (price / (1 - c) + (f.fixed || 0)) / (1 - p);
    return Math.ceil(Math.round((gross - price) * 1e6) / 1e4) / 100;
  };

  // What PayPal really charged on this payment (from the capture), so you can set "fees" in payments.json from real numbers
  const amt = (m) => (m?.value ? `${m.value} ${m.currency_code}` : '');
  function received(b) {
    if (!b) return {};
    const fee = Number(b.paypal_fee?.value || 0);
    const gross = Number(b.gross_amount?.value || 0);
    const out = {
      'PayPal fee charged': amt(b.paypal_fee),
      'PayPal fee %': gross && fee ? `${((fee / gross) * 100).toFixed(2)}% of ${amt(b.gross_amount)}` : '',
      'You received (net)': amt(b.net_amount),
      'Exchange rate used': b.exchange_rate?.value ? `1 ${b.exchange_rate.source_currency} = ${b.exchange_rate.value} ${b.exchange_rate.target_currency}` : '',
      'Received in your currency': amt(b.receivable_amount),
    };
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
  }

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
          // The fee is its own line, so the buyer's receipt and your PayPal activity show it
          if (o.fee > 0) o.items = [...o.items, { name: o.feeLabel || 'PayPal fee', sku: 'paypal-fee', qty: 1, unit: o.fee }];
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
              ...received(cap.seller_receivable_breakdown),
            },
          });
        },
        onError: () => error(),
      }).render(box);
    }).catch(() => { clearTimeout(timer); hide(); });
  };
})();
