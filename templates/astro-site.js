// Astro integration for this site (used in astro.config.mjs).
// Before the build the data is checked; after it, the files that are not pages are added to the static output.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function site() {
  return {
    name: 'arafatbin-site',
    hooks: {
      'astro:build:start': async () => {
        const { checkData } = await import('./build-steps.js');
        try {
          await checkData();
        } catch (e) {
          // Rules across several files (e.g. a price for every currency) throw one message; show it on GitHub too
          if (process.env.GITHUB_ACTIONS && !e.message.startsWith('Fix the data files')) console.log(`::error title=Data problem::${e.message.replace(/\n/g, ' ')}`);
          throw e;
        }
      },
      // dir = dist/client, the folder Cloudflare serves as static files
      'astro:build:done': async ({ dir, logger }) => {
        const { allPages } = await import('./pages.js');
        const { layout } = await import('./layout.js');
        const { finish } = await import('./build-steps.js');
        const pages = allPages();
        // Rendering again here tells the image step which WebP copies the pages use (same names as in the pages)
        pages.forEach((p) => layout(p));
        await finish(fileURLToPath(dir), pages);
        // Files only the GitHub Pages copy needs are not uploaded to Cloudflare
        const ignore = fileURLToPath(new URL('.assetsignore', dir));
        fs.appendFileSync(ignore, 'CNAME\n.nojekyll\n');
        // Local test secrets (.dev.vars, never committed) go next to the Worker settings for "npm run preview"
        const vars = path.join(process.cwd(), '.dev.vars');
        if (fs.existsSync(vars)) fs.copyFileSync(vars, fileURLToPath(new URL('../server/.dev.vars', dir)));
        logger.info(`Built ${pages.length} pages + sitemap.xml + robots.txt into dist/client/`);
      },
    },
  };
}
