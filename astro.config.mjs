// Astro builds the site into dist/: static pages in dist/client/, the small server part (order tracking API) in dist/server/.
// Cloudflare runs both (wrangler.jsonc). The pages themselves come from data/*.json through templates/.
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import site from './templates/astro-site.js';

export default defineConfig({
  site: 'https://arafatbin.com',
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'node' }),
  integrations: [site()],
  // assets/ is copied after the build (templates/build-steps.js), so there is no public/ folder
  publicDir: './no-public',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
