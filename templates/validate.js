// Checks every JSON file in data/ against the rules in schemas/ before the site is built.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read } from './helpers.js';

const SCHEMAS = path.join(ROOT, 'schemas');
const loadSchema = (name) => JSON.parse(fs.readFileSync(path.join(SCHEMAS, `${name}.schema.json`), 'utf8'));
const filesIn = (dir) => fs.readdirSync(path.join(ROOT, 'data', dir)).filter((f) => f.endsWith('.json')).map((f) => `${dir}/${f}`);

// Which schema checks which data file
const rules = [
  ['global/site.json', 'site'], ['global/header.json', 'header'], ['global/footer.json', 'footer'],
  ['global/contact.json', 'contact'], ['global/social.json', 'social'], ['global/sitemap.json', 'sitemap'],
  ['global/payments.json', 'payments'], ['collections/products.json', 'products'], ['collections/services.json', 'services'],
  ['collections/tools.json', 'tools'], ['global/rates.json', 'rates'],
  ...filesIn('collections/blog').map((f) => [f, 'post']),
  ...filesIn('pages').map((f) => [f, 'page']),
];

const TYPES = { integer: 'a whole number', number: 'a number', string: 'text in "quotes"', boolean: 'true or false', array: 'a list [ ]', object: 'a { } block' };

function describe(e) {
  const p = e.params;
  const value = typeof e.data === 'string' ? `"${e.data}"` : JSON.stringify(e.data);
  switch (e.keyword) {
    case 'required': return `missing "${p.missingProperty}"`;
    case 'additionalProperties': return `unknown field "${p.additionalProperty}" (check the spelling)`;
    case 'type': return `must be ${[].concat(p.type).map((t) => TYPES[t] || t).join(' or ')}, but is ${value}`;
    case 'enum': return `must be one of ${p.allowedValues.map((v) => `"${v}"`).join(', ')}, but is ${value}`;
    case 'pattern': return `${value} is not allowed here${e.parentSchema?.description ? `. ${e.parentSchema.description}` : ''}`;
    case 'oneOf': return 'use either "variants" (plans) or "prices" + "stock", not both';
    default: return `${e.message}${e.data !== undefined && typeof e.data !== 'object' ? `, but is ${value}` : ''}`;
  }
}

// "/0/variants/2/stock" -> "[netflix-shared-profile] › variants › 2 › stock"
function where(data, instancePath) {
  const parts = instancePath.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (Array.isArray(data) && parts.length) {
    const item = data[parts[0]];
    parts[0] = `[${item?.slug || item?.label || parts[0]}]`;
  }
  return parts.join(' › ');
}

export async function validateData() {
  let Ajv;
  try { Ajv = (await import('ajv')).default; } catch {
    console.warn('  ! ajv is not installed: JSON files were not checked (run npm install)');
    return;
  }
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
  ajv.addSchema(loadSchema('common'));
  const compiled = {};
  const problems = [];
  for (const [file, name] of rules) {
    const validate = (compiled[name] ||= ajv.compile(loadSchema(name)));
    const data = read(file);
    if (validate(data)) continue;
    // Hide the inner details of "either/or" rules; the summary line is clearer
    const errors = validate.errors.filter((e) => !/\/(oneOf|not)\//.test(e.schemaPath) && !['const', 'anyOf', 'if'].includes(e.keyword));
    for (const e of errors) problems.push(`data/${file} › ${where(data, e.instancePath) || '(top level)'}: ${describe(e)}`);
  }
  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s) in the data files:\n${[...new Set(problems)].map((p) => `  - ${p}`).join('\n')}\n`);
    throw new Error('Fix the data files above, then build again.');
  }
  console.log(`✓ ${rules.length} data files match their rules in schemas/`);
}
