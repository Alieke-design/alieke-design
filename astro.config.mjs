import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://alieke.design',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
