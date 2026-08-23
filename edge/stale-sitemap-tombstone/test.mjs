/* global Request */

import assert from 'node:assert/strict';
import tombstoneWorker from './src/index.js';

const sitemapResponse = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/sitemap-preview.xml'),
);

assert.equal(sitemapResponse.status, 404);
assert.equal(sitemapResponse.headers.get('cache-control'), 'no-store');
assert.equal(
  sitemapResponse.headers.get('content-type'),
  'text/plain; charset=utf-8',
);
assert.equal(
  sitemapResponse.headers.get('x-robots-tag'),
  'noindex, nofollow, noarchive',
);
assert.equal(await sitemapResponse.text(), 'Not found.\n');

const manifestResponse = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/site.webmanifest'),
);

assert.equal(manifestResponse.status, 404);
assert.equal(manifestResponse.headers.get('cache-control'), 'no-store');
assert.equal(
  manifestResponse.headers.get('content-type'),
  'text/html; charset=utf-8',
);
assert.equal(
  manifestResponse.headers.get('x-robots-tag'),
  'noindex, nofollow, noarchive',
);
assert.match(await manifestResponse.text(), /<title>Not found<\/title>/);

const robotsResponse = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/robots.txt'),
);

assert.equal(robotsResponse.status, 200);
assert.equal(
  robotsResponse.headers.get('cache-control'),
  'public, max-age=0, must-revalidate',
);
assert.equal(
  robotsResponse.headers.get('content-type'),
  'text/plain; charset=utf-8',
);
assert.equal(
  robotsResponse.headers.get('strict-transport-security'),
  'max-age=31536000',
);
for (const headerName of [
  'content-security-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'permissions-policy',
  'referrer-policy',
  'x-content-type-options',
  'x-frame-options',
]) {
  assert.ok(robotsResponse.headers.get(headerName), `${headerName} is present`);
}
assert.equal(robotsResponse.headers.get('access-control-allow-origin'), null);
assert.equal(await robotsResponse.text(), 'User-agent: *\nAllow: /\n');

const headResponse = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/robots.txt', { method: 'HEAD' }),
);

assert.equal(headResponse.status, 200);
assert.equal(await headResponse.text(), '');

const methodNotAllowedResponse = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/robots.txt', { method: 'POST' }),
);

assert.equal(methodNotAllowedResponse.status, 405);
assert.equal(methodNotAllowedResponse.headers.get('allow'), 'GET, HEAD');
assert.equal(methodNotAllowedResponse.headers.get('cache-control'), 'no-store');
