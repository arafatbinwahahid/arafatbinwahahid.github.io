// @ts-check
import { defineConfig } from 'astro/config';
import site from './src/data/settings/site.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
