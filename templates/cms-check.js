// Checks that the CMS form (templates/cms.js) has a field for every key in every data file.
// A key without a field would be dropped the next time that file is saved in the CMS.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.js';

const json = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

// Walk the data next to its field list; report every data key that has no field
function walk(value, fields, where, missing) {
  if (!fields || value == null || typeof value !== 'object') return;
  for (const [key, v] of Object.entries(value)) {
    const f = fields.find((x) => x.name === key);
    if (!f) { missing.push(`${where}.${key}`); continue; }
    checkField(v, f, `${where}.${key}`, missing);
  }
}

function checkField(v, f, where, missing) {
  if (f.widget === 'object') return walk(v, f.fields, where, missing);
  if (f.widget === 'list' && Array.isArray(v)) {
    v.forEach((item, i) => {
      if (f.types) {
        const t = f.types.find((x) => x.name === item?.[f.typeKey || 'type']);
        if (!t) return missing.push(`${where}[${i}] (type "${item?.type}")`);
        const { [f.typeKey || 'type']: _, ...rest } = item;
        walk(rest, t.fields, `${where}[${i}]`, missing);
      } else if (f.fields) walk(item, f.fields, `${where}[${i}]`, missing);
    });
  }
}

export function checkCms(config) {
  const missing = [];
  for (const c of config.collections) {
    if (c.files) {
      for (const file of c.files) {
        const data = json(file.file);
        const root = file.fields.find((x) => x.root);
        if (root?.widget === 'keyvalue') continue; // icons.json: any key is a pair
        if (root) checkField(data, root, file.file, missing);
        else walk(data, file.fields, file.file, missing);
      }
    } else if (c.file) {
      json(c.file).forEach((entry, i) => walk(entry, c.fields, `${c.file}[${entry.slug || i}]`, missing));
    } else if (c.folder) {
      for (const f of fs.readdirSync(path.join(ROOT, c.folder)).filter((x) => x.endsWith('.json'))) walk(json(`${c.folder}/${f}`), c.fields, `${c.folder}/${f}`, missing);
    }
  }
  if (missing.length) {
    throw new Error(`These data fields have no CMS field in templates/cms.js, so the CMS would delete them on save:\n  - ${missing.join('\n  - ')}`);
  }
}
