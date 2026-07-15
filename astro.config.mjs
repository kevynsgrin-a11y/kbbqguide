import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kbbqguide.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  security: {
    checkOrigin: true,
  },
  vite: {
    build: {
      sourcemap: false,
    },
  },
});
