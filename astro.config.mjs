import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kbbqguide.com',
  // Pages builders keep dying mid sharp pass (2026-09-21 deployments
  // 4efb3442/211cd4a4: build failure ~49s in, ~87% through the 894-variant
  // responsive pass; the same tree builds clean locally). Cap the transform
  // concurrency so peak sharp memory fits the Pages container.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: { limitConcurrency: true, concurrency: 2 },
    },
  },
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
