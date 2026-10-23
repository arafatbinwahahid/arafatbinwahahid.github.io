// Site search on /search/. The index in /pagefind/ is made by the build (templates/build-steps.js) from every page (Pagefind).
const form = document.querySelector('[data-search]');
const input = form.elements.q;
const status = document.querySelector('[data-search-status]');
const list = document.querySelector('[data-search-results]');
const D = form.dataset;
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
let pagefind = null;
let last = 0;

async function search(q) {
  const run = ++last;
  list.replaceChildren();
  if (!q) { status.textContent = ''; return; }
  status.textContent = D.loading;
  try {
    pagefind ||= await import('/pagefind/pagefind.js');
    const res = await pagefind.debouncedSearch(q, {}, 250);
    if (!res || run !== last) return;
    const items = await Promise.all(res.results.slice(0, 20).map((r) => r.data()));
    if (run !== last) return;
    status.textContent = fill(items.length ? D.resultsLabel : D.noResults, { n: res.results.length, q });
    for (const it of items) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it.url;
      a.className = 'card card-pad';
      const h = document.createElement('h2');
      h.className = 'h3';
      h.textContent = it.meta.title || it.url;
      const p = document.createElement('p');
      // Pagefind marks the matching words with <mark>; everything else in the excerpt is plain text
      p.innerHTML = it.excerpt;
      a.append(h, p);
      li.append(a);
      list.append(li);
    }
  } catch {
    status.textContent = D.unavailable;
  }
}

const params = new URLSearchParams(location.search);
input.value = params.get('q') || '';
search(input.value.trim());

input.addEventListener('input', () => search(input.value.trim()));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value.trim();
  history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname);
  search(q);
});
