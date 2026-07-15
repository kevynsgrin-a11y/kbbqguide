import { gzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { stdout } from 'node:process';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const files = walk(dist);
const htmlFiles = files.filter((file) => extname(file) === '.html');
if (htmlFiles.length !== 116)
  throw new Error(`Expected 116 static pages; found ${htmlFiles.length}.`);

const titles = new Set();
const canonicals = new Set();
let internalLinkCount = 0;
let outboundAnchorCount = 0;
let maxCompressedInlineJavaScript = 0;
let maxCompressedHtml = 0;
let maxUncompressedHtml = 0;
let thirdPartyScripts = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  maxCompressedHtml = Math.max(maxCompressedHtml, gzipSync(html).byteLength);
  maxUncompressedHtml = Math.max(maxUncompressedHtml, Buffer.byteLength(html));
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title) throw new Error(`Missing title: ${relative(dist, file)}`);
  if (titles.has(title)) throw new Error(`Duplicate title: ${title}`);
  titles.add(title);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical) throw new Error(`Missing canonical: ${relative(dist, file)}`);
  if (!canonical.startsWith('https://kbbqguide.com/'))
    throw new Error(`Unsafe preview canonical: ${canonical}`);
  if (canonicals.has(canonical))
    throw new Error(`Duplicate canonical: ${canonical}`);
  canonicals.add(canonical);
  if (!html.includes(`<meta property="og:url" content="${canonical}">`))
    throw new Error(`Open Graph URL mismatch: ${relative(dist, file)}`);
  if (!/<meta name="robots" content="noindex,nofollow,noarchive">/.test(html))
    throw new Error(
      `Missing preview robots directive: ${relative(dist, file)}`,
    );
  if (!/<main id="main-content"/.test(html))
    throw new Error(`Missing main landmark: ${relative(dist, file)}`);
  outboundAnchorCount += [...html.matchAll(/<a[^>]+href="https?:\/\//gi)]
    .length;
  if (/<iframe\b/i.test(html))
    throw new Error(`Unexpected iframe: ${relative(dist, file)}`);

  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(match[1] ?? '');
    } catch {
      throw new Error(`Invalid JSON-LD: ${relative(dist, file)}`);
    }
  }

  const inlineJavaScript = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
  ]
    .map((match) => match[1] ?? '')
    .join('\n');
  maxCompressedInlineJavaScript = Math.max(
    maxCompressedInlineJavaScript,
    gzipSync(inlineJavaScript).byteLength,
  );
  thirdPartyScripts += [
    ...html.matchAll(/<script[^>]*\bsrc="(https?:\/\/[^"]+)"/gi),
  ].length;

  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1]?.split(/[?#]/, 1)[0];
    if (!href || href.startsWith('//')) continue;
    internalLinkCount += 1;
    const relativeHref = href.replace(/^\//, '');
    const target =
      href === '/'
        ? join(dist, 'index.html')
        : extname(relativeHref)
          ? join(dist, relativeHref)
          : join(dist, relativeHref, 'index.html');
    if (!existsSync(target))
      throw new Error(
        `Broken internal link ${href} in ${relative(dist, file)}.`,
      );
  }
}

const recipePages = htmlFiles.filter((file) => {
  const route = relative(dist, file);
  return route.startsWith('recipes/') && route.split('/').length === 4;
});
if (recipePages.length !== 80)
  throw new Error(`Expected 80 recipe pages; found ${recipePages.length}.`);
for (const file of recipePages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('data-asset-status="placeholder"'))
    throw new Error(
      `Missing explicit media placeholder: ${relative(dist, file)}`,
    );
  if (/<img\b|<video\b/i.test(html))
    throw new Error(`Unapproved real media markup: ${relative(dist, file)}`);
  if (!html.includes('<noscript>'))
    throw new Error(
      `Missing no-JavaScript print fallback: ${relative(dist, file)}`,
    );
  if (!html.includes('Safety controls that stay visible'))
    throw new Error(`Missing visible safety section: ${relative(dist, file)}`);
  const linkedData = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1] ?? '{}'));
  if (!linkedData.some((item) => item['@type'] === 'Recipe'))
    throw new Error(`Missing Recipe JSON-LD: ${relative(dist, file)}`);
  if (!linkedData.some((item) => item['@type'] === 'BreadcrumbList'))
    throw new Error(
      `Missing recipe breadcrumbs JSON-LD: ${relative(dist, file)}`,
    );
  const recipeData = linkedData.find((item) => item['@type'] === 'Recipe');
  for (const prohibited of [
    'aggregateRating',
    'review',
    'nutrition',
    'video',
    'datePublished',
    'image',
  ]) {
    if (prohibited in recipeData)
      throw new Error(
        `Unapproved Recipe JSON-LD field ${prohibited}: ${relative(dist, file)}`,
      );
  }
}

const guidePages = htmlFiles.filter((file) => {
  const route = relative(dist, file);
  return route.startsWith('guides/') && route.split('/').length === 3;
});
if (guidePages.length !== 12)
  throw new Error(`Expected 12 guide pages; found ${guidePages.length}.`);
for (const file of guidePages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('Safety controls that stay visible'))
    throw new Error(`Missing guide safety review: ${relative(dist, file)}`);
  if (!html.includes('Draft G'))
    throw new Error(`Missing guide draft identity: ${relative(dist, file)}`);
}

const menuPages = htmlFiles.filter((file) =>
  /^menus\/(2|4|8)-guests\/index\.html$/.test(relative(dist, file)),
);
if (menuPages.length !== 3)
  throw new Error(`Expected 3 menu pages; found ${menuPages.length}.`);
for (const file of menuPages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('Consolidated planning list'))
    throw new Error(`Missing menu shopping list: ${relative(dist, file)}`);
  if (!html.includes('Guest count does not change safety limits'))
    throw new Error(`Missing menu safety limit: ${relative(dist, file)}`);
}

const toolsHtml = readFileSync(join(dist, 'tools', 'index.html'), 'utf8');
for (const toolId of [
  'quantity-scalers',
  'menu-builder',
  'prep-timeline',
  'equipment-checklist',
  'allergen-filter',
]) {
  if (!toolsHtml.includes(`id="${toolId}"`))
    throw new Error(`Missing progressive tool: ${toolId}`);
}
if (!toolsHtml.includes('cannot guarantee'))
  throw new Error('Missing non-medical allergen disclaimer.');
if (!toolsHtml.includes('<noscript>'))
  throw new Error('Planning tools require a no-JavaScript fallback.');

const shopHtml = readFileSync(join(dist, 'shop', 'index.html'), 'utf8');
if (!shopHtml.includes('data-affiliate-status="inactive"'))
  throw new Error('Shop preview is missing its inactive affiliate disclosure.');
if ([...shopHtml.matchAll(/data-revenue-status="disabled"/g)].length !== 7)
  throw new Error('Expected seven disabled revenue modules.');
if (!shopHtml.includes('data-ad-status="disabled"'))
  throw new Error('Shop preview is missing its disabled ad reservation.');
if (/<a[^>]+href="https?:\/\//i.test(shopHtml))
  throw new Error('Shop preview contains an active outbound link.');

const collectionPreviewPages = [
  'newsletter/index.html',
  'live-class/index.html',
  'media-kit/index.html',
  'licensing-inquiry/index.html',
  'brand-partnerships/index.html',
];
for (const route of collectionPreviewPages) {
  const html = readFileSync(join(dist, route), 'utf8');
  if (!html.includes('data-collection-status="disabled"'))
    throw new Error(`Collection preview is not disabled: ${route}`);
  if (/<form[^>]+\baction=/i.test(html))
    throw new Error(`Disabled preview form has an action: ${route}`);
  if (!/<button[^>]+disabled/i.test(html))
    throw new Error(`Disabled preview form has no disabled button: ${route}`);
  for (const control of html.matchAll(/<(input|textarea)([^>]*)>/gi)) {
    if (!/\bdisabled\b/i.test(control[2] ?? ''))
      throw new Error(`Enabled collection control in ${route}`);
  }
}

const affiliateDisclosureHtml = readFileSync(
  join(dist, 'affiliate-disclosure', 'index.html'),
  'utf8',
);
if (!affiliateDisclosureHtml.includes('No affiliate relationship is active'))
  throw new Error('Affiliate disclosure does not state the inactive status.');
const sponsoredPolicyHtml = readFileSync(
  join(dist, 'sponsored-content-policy', 'index.html'),
  'utf8',
);
if (!sponsoredPolicyHtml.includes('Editorial independence'))
  throw new Error('Sponsored content policy lacks editorial independence.');
if (outboundAnchorCount !== 0)
  throw new Error(
    `Expected zero outbound anchors; found ${outboundAnchorCount}.`,
  );

const requiredArtifacts = [
  'robots.txt',
  'sitemap-index.xml',
  'sitemap-preview.xml',
  'feed.xml',
  'site.webmanifest',
  'favicon.svg',
];
for (const artifact of requiredArtifacts) {
  if (!existsSync(join(dist, artifact)))
    throw new Error(`Missing discovery artifact: ${artifact}`);
}
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Disallow: /'))
  throw new Error('Preview robots.txt must disallow the complete site.');
const sitemap = readFileSync(join(dist, 'sitemap-preview.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
if (sitemapLocations.length !== 116)
  throw new Error(
    `Expected 116 preview sitemap URLs; found ${sitemapLocations.length}.`,
  );
if (new Set(sitemapLocations).size !== 116)
  throw new Error('Preview sitemap contains duplicate URLs.');
for (const canonical of canonicals) {
  if (!sitemapLocations.includes(canonical))
    throw new Error(`Canonical missing from preview sitemap: ${canonical}`);
}
const feed = readFileSync(join(dist, 'feed.xml'), 'utf8');
if (/<entry[\s>]/.test(feed))
  throw new Error('Preview feed must not claim unapproved published entries.');
JSON.parse(readFileSync(join(dist, 'site.webmanifest'), 'utf8'));

const cssFiles = files.filter((file) => extname(file) === '.css');
const jsFiles = files.filter((file) => extname(file) === '.js');
const compressedCss = cssFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0,
);
const compressedJs = jsFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0,
);
const maxEstimatedInitialCompressedTransfer =
  maxCompressedHtml + compressedCss + compressedJs;
if (compressedCss > 45 * 1024)
  throw new Error(`Compressed CSS exceeds 45 KB: ${compressedCss} bytes.`);
if (compressedJs > 35 * 1024)
  throw new Error(
    `Compressed recipe-route JavaScript exceeds 35 KB: ${compressedJs} bytes.`,
  );
if (maxCompressedInlineJavaScript > 35 * 1024)
  throw new Error(
    `Compressed inline JavaScript exceeds 35 KB: ${maxCompressedInlineJavaScript} bytes.`,
  );
if (maxEstimatedInitialCompressedTransfer > 900 * 1024)
  throw new Error(
    `Estimated initial transfer exceeds 900 KB: ${maxEstimatedInitialCompressedTransfer} bytes.`,
  );
if (thirdPartyScripts !== 0)
  throw new Error(
    `Expected zero third-party scripts; found ${thirdPartyScripts}.`,
  );
if (files.some((file) => /node_modules|\.map$/.test(file)))
  throw new Error('Build contains a source map or node_modules path.');

stdout.write(
  `${JSON.stringify({
    pages: htmlFiles.length,
    recipePages: recipePages.length,
    guidePages: guidePages.length,
    menuPages: menuPages.length,
    uniqueTitles: titles.size,
    uniqueCanonicals: canonicals.size,
    sitemapUrls: sitemapLocations.length,
    internalLinksChecked: internalLinkCount,
    outboundAnchors: outboundAnchorCount,
    compressedCssBytes: compressedCss,
    compressedExternalJavaScriptBytes: compressedJs,
    maxCompressedInlineJavaScriptBytes: maxCompressedInlineJavaScript,
    maxCompressedHtmlBytes: maxCompressedHtml,
    maxUncompressedHtmlBytes: maxUncompressedHtml,
    maxEstimatedInitialCompressedTransferBytes:
      maxEstimatedInitialCompressedTransfer,
    thirdPartyScripts,
  })}\n`,
);
