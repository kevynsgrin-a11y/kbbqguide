/* global Response */

const NOT_FOUND_HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'text/plain; charset=utf-8',
  'cross-origin-resource-policy': 'same-origin',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

/**
 * This Worker is deliberately route-scoped to the retired preview sitemap.
 * It does not proxy or handle any other KBBQGuide request.
 */
export default {
  fetch() {
    return new Response('Not found.\n', {
      status: 404,
      headers: NOT_FOUND_HEADERS,
    });
  },
};
