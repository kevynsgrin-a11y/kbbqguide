import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { stdout } from 'node:process';

const dist = path.resolve(import.meta.dirname, '../dist');
const headerText = await readFile(path.join(dist, '_headers'), 'utf8');
const htmlCacheControl =
  'public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400';

function parseHeaderBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const [rule, ...headerLines] = lines;
      if (!rule?.startsWith('/'))
        throw new Error(`Malformed _headers rule: ${rule ?? '(missing)'}`);
      const actions = headerLines.map((line) => {
        if (line.startsWith('! ')) {
          const name = line.slice(2).trim().toLowerCase();
          if (!/^[a-z0-9-]+$/.test(name))
            throw new Error(`Malformed detached header: ${line}`);
          return { type: 'detach', name };
        }
        const separator = line.indexOf(':');
        if (separator < 1)
          throw new Error(`Malformed security header: ${line}`);
        return {
          type: 'set',
          name: line.slice(0, separator).toLowerCase(),
          value: line.slice(separator + 1).trim(),
        };
      });
      return { rule, actions };
    });
}

const headerBlocks = parseHeaderBlocks(headerText);
const globalBlock = headerBlocks.find((block) => block.rule === '/*');
if (!globalBlock) throw new Error('Missing global /* _headers rule.');
const headers = new Map(
  globalBlock.actions
    .filter((action) => action.type === 'set')
    .map((action) => [action.name, action.value]),
);

function headerActions(rule, name) {
  const block = headerBlocks.find((candidate) => candidate.rule === rule);
  if (!block) throw new Error(`Missing _headers rule: ${rule}`);
  return block.actions.filter((action) => action.name === name);
}

const requiredHeaders = {
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};
for (const [name, expected] of Object.entries(requiredHeaders)) {
  if (headers.get(name) !== expected) {
    throw new Error(`Expected ${name}: ${expected}`);
  }
}
if (!headers.get('permissions-policy')?.includes('camera=()')) {
  throw new Error('Permissions-Policy does not deny camera access.');
}
const hsts = headers.get('strict-transport-security');
if (hsts !== 'max-age=31536000') {
  throw new Error(
    'Expected the approved one-year, host-only HSTS rollout policy.',
  );
}

const globalCorsActions = headerActions('/*', 'access-control-allow-origin');
if (!globalCorsActions.some((action) => action.type === 'detach')) {
  throw new Error(
    'Global _headers policy must detach the Cloudflare Pages default Access-Control-Allow-Origin header.',
  );
}
if (globalCorsActions.some((action) => action.type === 'set')) {
  throw new Error(
    'Global _headers policy must not re-add Access-Control-Allow-Origin.',
  );
}
const corsReadditions = headerBlocks.flatMap((block) =>
  block.actions.filter(
    (action) =>
      action.name === 'access-control-allow-origin' && action.type === 'set',
  ),
);
if (corsReadditions.length !== 0) {
  throw new Error(
    'No static asset currently has documented cross-origin embedding requirements; do not re-add Access-Control-Allow-Origin.',
  );
}

if (headerActions('/*', 'cache-control').length !== 0) {
  throw new Error(
    'Do not attach Cache-Control to the global rule; it would overlap hashed assets and file endpoints.',
  );
}
const allowedCacheControlRules = new Set(['/', '/*/', '/_astro/*']);
for (const block of headerBlocks) {
  if (
    block.actions.some((action) => action.name === 'cache-control') &&
    !allowedCacheControlRules.has(block.rule)
  ) {
    throw new Error(
      `Any additional Cache-Control _headers rule can overlap the HTML or asset contract: ${block.rule}.`,
    );
  }
}
for (const rule of ['/', '/*/']) {
  const cacheActions = headerActions(rule, 'cache-control');
  if (
    cacheActions.length !== 1 ||
    cacheActions[0]?.type !== 'set' ||
    cacheActions[0].value !== htmlCacheControl
  ) {
    throw new Error(
      `Expected exactly one scoped HTML Cache-Control contract on ${rule}.`,
    );
  }
}
const astroCacheActions = headerActions('/_astro/*', 'cache-control');
if (
  astroCacheActions.length !== 1 ||
  astroCacheActions[0]?.type !== 'set' ||
  astroCacheActions[0].value !== 'public, max-age=31536000, immutable'
) {
  throw new Error(
    'Expected exactly one immutable Cache-Control policy for hashed Astro assets.',
  );
}

const csp = headers.get('content-security-policy');
if (!csp) throw new Error('Content-Security-Policy is missing.');
if (/unsafe-inline|unsafe-eval|https?:|\*/.test(csp)) {
  throw new Error(
    'CSP contains a prohibited broad script/style/network source.',
  );
}
const directives = new Map(
  csp.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values];
  }),
);
const exactDirectives = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'media-src': ["'self'"],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'script-src-attr': ["'none'"],
  'style-src': ["'self'"],
  'style-src-attr': ["'none'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
};
for (const [directive, expected] of Object.entries(exactDirectives)) {
  if (JSON.stringify(directives.get(directive)) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected ${directive} policy.`);
  }
}
if (!directives.has('upgrade-insecure-requests')) {
  throw new Error('CSP must upgrade accidental insecure production requests.');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
const executableHashes = new Set();
let inlineStyleCount = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  inlineStyleCount += (html.match(/\sstyle=/g) ?? []).length;
  inlineStyleCount += (html.match(/<style(?:\s|>)/g) ?? []).length;
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attributes = match[1];
    if (/\ssrc=/.test(attributes)) continue;
    const type = /\stype="([^"]+)"/.exec(attributes)?.[1] ?? 'classic';
    if (type === 'application/ld+json' || type === 'application/json') continue;
    const hash = createHash('sha256').update(match[2]).digest('base64');
    executableHashes.add(`'sha256-${hash}'`);
  }
}
if (inlineStyleCount !== 0) {
  throw new Error(
    `Found ${inlineStyleCount} inline style blocks or attributes.`,
  );
}
const allowedScripts = new Set(
  (directives.get('script-src') ?? []).filter((value) =>
    value.startsWith("'sha256-"),
  ),
);
if (
  executableHashes.size !== allowedScripts.size ||
  [...executableHashes].some((hash) => !allowedScripts.has(hash))
) {
  throw new Error(
    'CSP script hashes do not exactly match the built executable inline modules.',
  );
}

stdout.write(
  `${JSON.stringify({
    htmlPages: htmlFiles.length,
    securityHeaders: headers.size,
    cspDirectives: directives.size,
    executableInlineModules: executableHashes.size,
    inlineStyles: inlineStyleCount,
    hstsPolicy: 'one-year-host-only',
    corsPolicy: 'detached-pages-default-with-no-readditions',
    htmlCachePolicy: {
      rules: ['/', '/*/'],
      value: htmlCacheControl,
      externalCacheRuleRequired: true,
    },
  })}\n`,
);
