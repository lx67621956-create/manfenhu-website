import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.manfenhu.com',
  integrations: [
    sitemap(),
    mdx(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  output: 'static',
  adapter: vercel(),
});