import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new globalThis.Response(
    JSON.stringify({
      name: 'KBBQGuide',
      short_name: 'KBBQGuide',
      description:
        'Korean BBQ recipes, menus, and planning tools for the whole table.',
      start_url: '/',
      scope: '/',
      display: 'browser',
      background_color: '#fffaf0',
      theme_color: '#171916',
      icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
    }),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
