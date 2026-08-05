import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.manfenhu.com',
  integrations: [
    sitemap({
      filter: page => !page.endsWith('/team/') && !page.endsWith('/venue/'),
    }),
    mdx(),
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
