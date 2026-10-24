const root = document.querySelector('[data-publish]');
const $ = (s) => root.querySelector(s);
const D = JSON.parse(document.getElementById('publish-data').textContent);
const R = D.repo;
let token = sessionStorage.getItem('ghToken') || '';
let state = {};
let timer;
const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text != null ? { textContent: text } : {});
const say = (node, text, ok) => { node.textContent = text; node.className = `status ${ok ? 'ok' : 'err'}`; };
const when = (iso) => new Date(iso).toLocaleString(D.locale, { dateStyle: 'medium', timeStyle: 'short' });
async function gh(path, { method = 'GET', body } = {}) {
const r = await fetch(`https://api.github.com/repos/${R}${path}`, {
method,
headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body && { 'Content-Type': 'application/json' }) },
body: body && JSON.stringify(body),
});
if (r.status === 401) { logout(); throw new Error('GitHub did not accept the token. Check it, or make a new one.'); }
const data = r.status === 204 ? {} : await r.json().catch(() => ({}));
if (!r.ok) throw Object.assign(new Error(data.message || `GitHub error ${r.status}`), { status: r.status });
return data;
}
const sha = async (branch) => (await gh(`/git/ref/heads/${branch}`)).object.sha;
const moveDrafts = (to, force = false) => gh(`/git/refs/heads/${D.drafts}`, { method: 'PATCH', body: { sha: to, force } });
function nice(file) {
const m = file.match(/^data\/(collections|pages|global)\/(.+)\.json$/);
if (m) return m[1] === 'collections' ? (m[2].startsWith('blog/') ? `Blog post: ${m[2].slice(5)}` : m[2][0].toUpperCase() + m[2].slice(1)) : `${m[1] === 'pages' ? 'Page' : 'Settings'}: ${m[2]}`;
if (file.startsWith('assets/images/')) return `Image: ${file.split('/').pop()}`;
return file;
}
async function refresh() {
clearTimeout(timer);
const status = $('[data-app-status]');
say(status, 'Loading…', true);
try {
const mainSha = await sha(D.main);
let draftSha;
try { draftSha = await sha(D.drafts); } catch (e) {
if (e.status !== 404) throw e;
state = { mainSha };
$('[data-create]').hidden = false;
$('[data-check]').hidden = $('[data-changes]').hidden = true;
$('[data-publish-all]').disabled = true;
return say(status, '');
}
$('[data-create]').hidden = true;
let cmp = await gh(`/compare/${D.main}...${D.drafts}`);
if (cmp.behind_by && !cmp.ahead_by) { await moveDrafts(mainSha); draftSha = mainSha; cmp = await gh(`/compare/${D.main}...${D.drafts}`); }
else if (cmp.behind_by) {
const m = await gh('/merges', { method: 'POST', body: { base: D.drafts, head: D.main, commit_message: 'Bring the latest site code into the drafts' } });
draftSha = m.sha || (await sha(D.drafts));
cmp = await gh(`/compare/${D.main}...${D.drafts}`);
}
state = { mainSha, draftSha, ahead: cmp.ahead_by };
renderChanges(cmp);
$('[data-check]').hidden = !cmp.ahead_by;
const ok = cmp.ahead_by ? await renderCheck(draftSha) : false;
$('[data-publish-all]').disabled = !ok;
say(status, cmp.ahead_by ? '' : 'Nothing to publish: the site already has every saved change.', true);
} catch (e) {
say(status, e.status === 409 ? 'The drafts and the site code changed the same lines. Ask for help before publishing.' : e.message);
}
}
function renderChanges(cmp) {
$('[data-changes]').hidden = !cmp.ahead_by;
const commits = cmp.commits.filter((c) => !c.commit.message.startsWith('Bring the latest site code'));
$('[data-changes-title]').textContent = `Waiting to be published (${commits.length} save${commits.length === 1 ? '' : 's'})`;
$('[data-change-list]').replaceChildren(...commits.reverse().map((c) => {
const li = el('li');
li.append(el('b', '', c.commit.message.split('\n')[0]), el('small', 'muted', when(c.commit.author.date)));
return li;
}));
$('[data-file-list]').replaceChildren(...(cmp.files || []).map((f) => el('li', '', `${nice(f.filename)} (${f.status})`)));
}
async function renderCheck(draftSha) {
const box = $('[data-check]');
const text = $('[data-check-text]');
const list = $('[data-problems]');
box.hidden = false;
list.replaceChildren();
const { check_runs: runs = [] } = await gh(`/commits/${draftSha}/check-runs?check_name=build`);
const run = runs[0];
if (!run || run.status !== 'completed') {
box.className = 'card card-pad publish-check';
text.textContent = 'GitHub is checking the drafts (about 2 minutes). This page updates by itself.';
timer = setTimeout(refresh, 15000);
return false;
}
if (run.conclusion === 'success') {
box.className = 'card card-pad publish-check is-ok';
text.textContent = '✓ The check passed. Everything can be published.';
return true;
}
box.className = 'card card-pad publish-check is-bad';
text.textContent = 'The check found problems. Fix them in the CMS and save again; the check then runs again by itself.';
const notes = await gh(`/check-runs/${run.id}/annotations`).catch(() => []);
const problems = notes.filter((n) => n.annotation_level === 'failure' && !/Process completed with exit code/.test(n.message));
list.replaceChildren(...(problems.length ? problems.map((n) => el('li', '', n.message)) : [el('li', '', 'See the details on GitHub.')]));
const a = el('a', '', 'Open the check on GitHub');
Object.assign(a, { href: run.html_url, target: '_blank', rel: 'noopener' });
const li = el('li');
li.append(a);
list.append(li);
return false;
}
$('[data-publish-all]').addEventListener('click', async () => {
const status = $('[data-app-status]');
const btn = $('[data-publish-all]');
btn.disabled = true;
say(status, 'Publishing…', true);
try {
const m = await gh('/merges', { method: 'POST', body: { base: D.main, head: D.drafts, commit_message: `Publish ${state.ahead} CMS change(s)` } });
await moveDrafts(m.sha || (await sha(D.main)));
say(status, '✓ Published. Cloudflare updates the site in 3–5 minutes.', true);
setTimeout(refresh, 3000);
} catch (e) {
btn.disabled = false;
say(status, e.status === 409 ? 'The drafts and the site code changed the same lines. Ask for help before publishing.' : e.message);
}
});
$('[data-discard]').addEventListener('click', async () => {
if (!confirm('Throw away every draft that is not published yet? This cannot be undone.')) return;
try { await moveDrafts(state.mainSha, true); refresh(); } catch (e) { say($('[data-app-status]'), e.message); }
});
$('[data-create-branch]').addEventListener('click', async () => {
try { await gh('/git/refs', { method: 'POST', body: { ref: `refs/heads/${D.drafts}`, sha: state.mainSha } }); refresh(); } catch (e) { say($('[data-app-status]'), e.message); }
});
$('[data-refresh]').addEventListener('click', refresh);
function logout() {
token = '';
sessionStorage.removeItem('ghToken');
clearTimeout(timer);
$('[data-app]').hidden = true;
$('[data-login]').hidden = false;
}
$('[data-logout]').addEventListener('click', logout);
$('[data-login]').addEventListener('submit', async (e) => {
e.preventDefault();
token = e.target.token.value.trim();
try {
await gh('');
sessionStorage.setItem('ghToken', token);
start();
} catch (err) { say($('[data-login-status]'), err.message); }
});
function start() {
$('[data-login]').hidden = true;
$('[data-app]').hidden = false;
refresh();
}
if (token) start();