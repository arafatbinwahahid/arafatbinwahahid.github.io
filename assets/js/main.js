// 1. Close the 3-dot menu when clicking outside it or pressing Escape
const menu = document.querySelector('.menu');
document.addEventListener('click', (e) => { if (menu?.open && !menu.contains(e.target)) menu.open = false; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu) menu.open = false; });

// 2. Shop category filter
document.querySelectorAll('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach((c) => c.classList.toggle('is-on', c === chip));
  document.querySelectorAll('#products [data-cat]').forEach((card) => {
    card.hidden = chip.dataset.filter !== 'all' && card.dataset.cat !== chip.dataset.filter;
  });
}));

// 3. Contact + review forms (sent with Web3Forms)
const key = document.body.dataset.formsKey;
document.querySelectorAll('form[data-form]').forEach((form) => {
  const status = form.querySelector('.status');
  const say = (text, ok) => { status.textContent = text; status.className = 'status ' + (ok ? 'ok' : 'err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return;
    const f = form.elements;
    const data = { access_key: key, from_name: 'Website', name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() };
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
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!(await res.json()).success) throw new Error();
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
