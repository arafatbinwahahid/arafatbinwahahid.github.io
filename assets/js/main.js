// 1. Close the 3-dot menu when clicking outside it or pressing Escape
const menu = document.querySelector('.menu');
document.addEventListener('click', (e) => { if (menu?.open && !menu.contains(e.target)) menu.open = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu) menu.open = false; });

// 2. Send data to Web3Forms (used by the forms below and by shop.js)
window.sendToWeb3Forms = async (data) => {
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: document.body.dataset.formsKey, from_name: 'Website', ...data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || 'Send failed');
};

// Save an order for tracking (/track/) in the Cloudflare database. Gives the tracking link, or '' where there is no
// order API (e.g. the copy on GitHub Pages); the order is still sent by email then.
window.saveOrder = async (order) => {
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return '';
    return new URL((await r.json()).track, location.origin).href;
  } catch {
    return '';
  }
};

// 3. Contact + review forms
document.querySelectorAll('form[data-form]').forEach((form) => {
  const status = form.querySelector('.status');
  const say = (text, ok) => { status.textContent = text; status.className = 'status ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return;
    const f = form.elements;
    const data = { name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() };
    if (form.dataset.form === 'review') {
      if (!f.rating.value) return say(form.dataset.ratingError);
      data.subject = `New review: ${f.rating.value} of 5 stars`;
      data.rating = f.rating.value + ' / 5';
      data.allow_public = f.allow_public.checked ? 'Yes' : 'No';
    } else {
      data.subject = 'New message from website: ' + data.name;
    }
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      await window.sendToWeb3Forms(data);
      say(form.dataset.success, true);
      form.reset();
    } catch {
      say(form.dataset.error);
    }
    button.disabled = false;
  });

  // "Send on WhatsApp" button on the contact form
  form.querySelector('[data-wa]')?.addEventListener('click', (e) => {
    const f = form.elements;
    const text = `Hello, my name is ${f.name.value.trim() || '...'}. ${f.message.value.trim()}`;
    window.open(`https://wa.me/${e.currentTarget.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
});

// Product and service galleries: a thumbnail shows its picture
document.querySelectorAll('.gallery').forEach((g) => g.querySelectorAll('[data-thumb]').forEach((t) => t.addEventListener('click', () => {
  g.querySelectorAll('[data-slide]').forEach((s) => { s.hidden = s.dataset.slide !== t.dataset.thumb; });
  g.querySelectorAll('[data-thumb]').forEach((x) => x.toggleAttribute('aria-current', x === t));
})));
