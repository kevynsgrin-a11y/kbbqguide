/* global Request */

import assert from 'node:assert/strict';
import tombstoneWorker from './src/index.js';

const response = await tombstoneWorker.fetch(
  new Request('https://kbbqguide.com/sitemap-preview.xml'),
);

assert.equal(response.status, 404);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
assert.equal(
  response.headers.get('x-robots-tag'),
  'noindex, nofollow, noarchive',
);
assert.equal(await response.text(), 'Not found.\n');
