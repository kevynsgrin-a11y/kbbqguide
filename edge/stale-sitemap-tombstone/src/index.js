/* global Response, URL */

const SECURITY_HEADERS = {
  'content-security-policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; script-src 'self' 'sha256-Nvg0Yeurzlo5I0GAvC0MtcVUujEBm5WPkNN0FMTQwL4=' 'sha256-mY1aeq7OX8BAFqPOwBdFmXI0vo3hdi/MAIagNUC6lJ8=' 'sha256-qmObFAuCQN3yjtsjGehXuNYJrJAqk0g+X3sgrOTQqMk='; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'permissions-policy':
    'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), web-share=(), xr-spatial-tracking=()',
  'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

const NOT_FOUND_HEADERS = {
  ...SECURITY_HEADERS,
  'cache-control': 'no-store',
  'content-type': 'text/plain; charset=utf-8',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

const MANIFEST_NOT_FOUND_HEADERS = {
  ...SECURITY_HEADERS,
  'cache-control': 'no-store',
  'content-type': 'text/html; charset=utf-8',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

const ROBOTS_HEADERS = {
  ...SECURITY_HEADERS,
  'cache-control': 'public, max-age=0, must-revalidate',
  'content-type': 'text/plain; charset=utf-8',
};

const METHOD_NOT_ALLOWED_HEADERS = {
  ...NOT_FOUND_HEADERS,
  allow: 'GET, HEAD',
};

/**
 * This Worker is deliberately route-scoped to stale static KBBQGuide paths.
 * It never proxies or handles a page, asset, API, or wildcard route.
 */
export default {
  fetch(request) {
    const headOnly = request.method === 'HEAD';

    if (request.method !== 'GET' && !headOnly) {
      return new Response('Method not allowed.\n', {
        status: 405,
        headers: METHOD_NOT_ALLOWED_HEADERS,
      });
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/robots.txt') {
      return new Response(headOnly ? null : 'User-agent: *\nAllow: /\n', {
        status: 200,
        headers: ROBOTS_HEADERS,
      });
    }

    if (pathname === '/site.webmanifest') {
      return new Response(
        headOnly
          ? null
          : '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><title>Not found</title></head><body><p>Not found.</p></body></html>',
        {
          status: 404,
          headers: MANIFEST_NOT_FOUND_HEADERS,
        },
      );
    }

    return new Response(headOnly ? null : 'Not found.\n', {
      status: 404,
      headers: NOT_FOUND_HEADERS,
    });
  },
};
