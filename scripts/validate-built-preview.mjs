import { gzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { stdout } from 'node:process';
import { evaluatePerformanceBudget } from './performance-budget.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'data/media-manifest.json'), 'utf8'),
);
const urlRegistry = JSON.parse(
  readFileSync(resolve(root, 'data/url-registry.json'), 'utf8'),
);
const performanceBudget = JSON.parse(
  readFileSync(resolve(root, 'data/performance-budget.json'), 'utf8'),
);
const allowedActiveStatuses = new Set([
  'original-approved',
  'licensed-approved',
  'synthetic-labeled',
]);
const manifestAssetsById = new Map(
  manifest.assets.map((asset) => [asset.assetId, asset]),
);
const activeAssets = manifest.assets.filter(
  (asset) => asset.status !== 'replaced',
);
if (manifestAssetsById.size !== manifest.assets.length)
  throw new Error('Media manifest contains duplicate immutable asset IDs.');
for (const asset of manifest.assets) {
  if (!allowedActiveStatuses.has(asset.assetStatus))
    throw new Error(
      `Manifest asset ${asset.assetId} has unapproved provenance status ${asset.assetStatus}.`,
    );
  if (/^(?:https?:)?\/\//i.test(asset.path))
    throw new Error(`Remote media path is forbidden: ${asset.path}`);
  if (!existsSync(resolve(root, asset.path)))
    throw new Error(`Manifest media master is missing: ${asset.path}`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeFor(file) {
  return relative(dist, file).replaceAll('\\', '/');
}

function pngDimensions(file) {
  const bytes = readFileSync(file);
  const signature = '89504e470d0a1a0a';
  if (bytes.subarray(0, 8).toString('hex') !== signature)
    throw new Error(`Icon is not a PNG: ${routeFor(file)}.`);
  if (bytes.subarray(12, 16).toString('ascii') !== 'IHDR')
    throw new Error(`Icon is missing an IHDR chunk: ${routeFor(file)}.`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const files = walk(dist);
const htmlFiles = files.filter((file) => extname(file) === '.html');
const errorDocument = join(dist, '404.html');
if (!existsSync(errorDocument))
  throw new Error('Missing static 404.html error document.');
const errorDocumentHtml = readFileSync(errorDocument, 'utf8');
if (!/<h1>Page not found\.<\/h1>/.test(errorDocumentHtml))
  throw new Error('Static 404.html does not render the not-found page.');
if (
  !/<meta name="robots" content="noindex,nofollow,noarchive">/.test(
    errorDocumentHtml,
  )
)
  throw new Error('Static 404.html must remain noindex in the preview.');
const contentHtmlFiles = htmlFiles.filter((file) => file !== errorDocument);
if (contentHtmlFiles.length < 116)
  throw new Error(
    `Expected at least 116 static content pages plus 404.html; found ${contentHtmlFiles.length} content pages.`,
  );

const titles = new Set();
const canonicals = new Set();
let internalLinkCount = 0;
let outboundAnchorCount = 0;
let structuredDataBlockCount = 0;
let maxCompressedInlineJavaScript = 0;
let maxCompressedHtml = 0;
let maxUncompressedHtml = 0;
let thirdPartyScripts = 0;
const referencedAssetPaths = new Set();
const renderedMediaIds = new Set();
const eagerImageCandidates = new Map();
const routesWithoutLcpMedia = new Set([
  'about/index.html',
  'affiliate-disclosure/index.html',
  'accessibility/index.html',
  'contact/index.html',
  'corrections/index.html',
  'editorial-policy/index.html',
  'sponsored-content-policy/index.html',
  'privacy-policy/index.html',
  'recipe-testing-policy/index.html',
  'sitemap/index.html',
  'terms/index.html',
]);
for (const file of contentHtmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeFor(file);
  maxCompressedHtml = Math.max(maxCompressedHtml, gzipSync(html).byteLength);
  maxUncompressedHtml = Math.max(maxUncompressedHtml, Buffer.byteLength(html));
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title) throw new Error(`Missing title: ${routeFor(file)}`);
  if (titles.has(title)) throw new Error(`Duplicate title: ${title}`);
  titles.add(title);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical) throw new Error(`Missing canonical: ${routeFor(file)}`);
  if (!canonical.startsWith('https://kbbqguide.com/'))
    throw new Error(`Unsafe preview canonical: ${canonical}`);
  if (canonicals.has(canonical))
    throw new Error(`Duplicate canonical: ${canonical}`);
  canonicals.add(canonical);
  if (!html.includes(`<meta property="og:url" content="${canonical}">`))
    throw new Error(`Open Graph URL mismatch: ${routeFor(file)}`);
  if (!/<meta name="robots" content="noindex,nofollow,noarchive">/.test(html))
    throw new Error(`Missing preview robots directive: ${routeFor(file)}`);
  if (!/<meta name="color-scheme" content="light dark">/.test(html))
    throw new Error(`Missing light/dark color-scheme declaration: ${route}.`);
  if (
    !/<meta name="theme-color" content="#fffaf1" media="\(prefers-color-scheme: light\)">/.test(
      html,
    ) ||
    !/<meta name="theme-color" content="#151713" media="\(prefers-color-scheme: dark\)">/.test(
      html,
    )
  )
    throw new Error(`Missing system-theme browser color metadata: ${route}.`);
  if (/<link\b[^>]*\brel="manifest"/i.test(html))
    throw new Error(`PWA manifest link is prohibited in preview: ${route}.`);
  for (const icon of [
    /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/,
    /<link rel="icon" href="\/favicon-32\.png" sizes="32x32" type="image\/png">/,
    /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png" sizes="180x180">/,
  ]) {
    if (!icon.test(html))
      throw new Error(`Missing browser icon reference in ${route}.`);
  }
  if (!/<main id="main-content"/.test(html))
    throw new Error(`Missing main landmark: ${routeFor(file)}`);
  outboundAnchorCount += [...html.matchAll(/<a[^>]+href="https?:\/\//gi)]
    .length;
  if (/<iframe\b/i.test(html))
    throw new Error(`Unexpected iframe: ${routeFor(file)}`);
  if (/\sstyle\s*=/i.test(html))
    throw new Error(`Inline style attribute: ${routeFor(file)}`);
  if (/<(?:img|source)[^>]+(?:src|srcset)="(?:https?:)?\/\//i.test(html))
    throw new Error(`Remote or hotlinked image: ${routeFor(file)}`);

  const renderedIds = [...html.matchAll(/data-media-id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const mediaId of renderedIds) {
    const asset = manifestAssetsById.get(mediaId);
    if (!asset)
      throw new Error(`Unregistered rendered media ${mediaId} in ${route}.`);
    if (asset.status === 'replaced')
      throw new Error(`Superseded media ${mediaId} rendered in ${route}.`);
    if (!allowedActiveStatuses.has(asset.assetStatus))
      throw new Error(`Unapproved rendered media ${mediaId} in ${route}.`);
    if (!html.includes(`data-media-id="${mediaId}"`))
      throw new Error(
        `Media ID serialization failed for ${mediaId} in ${route}.`,
      );
    renderedMediaIds.add(mediaId);
  }
  for (const figure of html.matchAll(/<figure\b[^>]*>/gi)) {
    const tag = figure[0];
    const mediaId = tag.match(/data-media-id="([^"]+)"/)?.[1];
    if (!mediaId) continue;
    const status = tag.match(/data-asset-status="([^"]+)"/)?.[1];
    const asset = manifestAssetsById.get(mediaId);
    if (!asset || status !== asset.assetStatus)
      throw new Error(
        `Rendered media status mismatch for ${mediaId} in ${route}.`,
      );
  }

  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(
    (match) => match[0],
  );
  const eagerImages = imageTags.filter((tag) => /\bloading="eager"/i.test(tag));
  const highPriorityImages = imageTags.filter((tag) =>
    /\bfetchpriority="high"/i.test(tag),
  );
  if (eagerImages.length > 1 || highPriorityImages.length > 1)
    throw new Error(`More than one prioritized image in ${route}.`);
  if (eagerImages.length !== highPriorityImages.length)
    throw new Error(`Eager/high-priority mismatch in ${route}.`);
  if (routesWithoutLcpMedia.has(route)) {
    if (eagerImages.length !== 0)
      throw new Error(`Policy route unexpectedly prioritizes media: ${route}.`);
  } else if (eagerImages.length !== 1) {
    throw new Error(`Expected exactly one LCP image in ${route}.`);
  }
  for (const tag of imageTags) {
    if (!/\bwidth="\d+"/i.test(tag) || !/\bheight="\d+"/i.test(tag))
      throw new Error(`Image lacks intrinsic dimensions in ${route}.`);
    if (!/\balt(?:="[^"]*")?(?=\s|>)/i.test(tag))
      throw new Error(`Image lacks an alt attribute in ${route}.`);
    if (!/\bloading="(?:eager|lazy)"/i.test(tag))
      throw new Error(`Image lacks an explicit loading policy in ${route}.`);
    if (/\bloading="eager"/i.test(tag) && !/\bfetchpriority="high"/i.test(tag))
      throw new Error(`Eager image lacks high priority in ${route}.`);
    if (/\bloading="lazy"/i.test(tag) && /\bfetchpriority="high"/i.test(tag))
      throw new Error(`Lazy image has high priority in ${route}.`);
  }

  for (const picture of html.matchAll(/<picture\b[\s\S]*?<\/picture>/gi)) {
    const markup = picture[0];
    if (!/\bloading="eager"/i.test(markup)) continue;
    const pictureTags = [...markup.matchAll(/<(source|img)\b[^>]*>/gi)].map(
      (match) => ({ tagName: match[1]?.toLowerCase(), markup: match[0] }),
    );
    const isMobileSource = (tag) =>
      /\bmedia="\(max-width:\s*600px\)"/i.test(tag.markup);
    const isTypedSource = (tag, type) =>
      tag.tagName === 'source' &&
      isMobileSource(tag) &&
      new RegExp(`\\btype="${type}"`, 'i').test(tag.markup);
    const isDesktopTypedSource = (tag, type) =>
      tag.tagName === 'source' &&
      !isMobileSource(tag) &&
      tag.markup.toLowerCase().includes('type="' + type + '"');
    if (!pictureTags.some((tag) => isTypedSource(tag, 'image/webp')))
      throw new Error(
        `Eager image has no bounded mobile WebP source in ${route}.`,
      );
    if (!pictureTags.some((tag) => isTypedSource(tag, 'image/jpeg')))
      throw new Error(
        `Eager image has no bounded mobile JPEG source in ${route}.`,
      );

    if (!pictureTags.some((tag) => isDesktopTypedSource(tag, 'image/webp')))
      throw new Error(
        'Eager image has no desktop WebP source in ' + route + '.',
      );
    if (!pictureTags.some((tag) => isDesktopTypedSource(tag, 'image/jpeg')))
      throw new Error(
        'Eager image has no desktop JPEG source in ' + route + '.',
      );

    const fallbackTag = pictureTags.find((tag) => tag.tagName === 'img');
    if (!fallbackTag || !/\bsrcset="[^"]+"/i.test(fallbackTag.markup))
      throw new Error(
        `Eager image has no measurable JPEG fallback in ${route}.`,
      );

    for (const tag of pictureTags) {
      const mobileSource = isMobileSource(tag);
      const scope = mobileSource
        ? 'mobile'
        : tag.tagName === 'img'
          ? 'mobile-fallback'
          : 'desktop';
      for (const match of tag.markup.matchAll(/\b(src|srcset)="([^"]+)"/gi)) {
        for (const candidate of (match[2] ?? '').split(',')) {
          const [path, descriptor = ''] = candidate.trim().split(/\s+/, 2);
          if (!path?.startsWith('/')) continue;
          const key = `${scope}:${path}`;
          const record = eagerImageCandidates.get(key) ?? {
            assetPath: path,
            descriptors: new Set(),
            scopes: new Set(),
          };
          record.descriptors.add(descriptor);
          record.scopes.add(scope);
          eagerImageCandidates.set(key, record);
        }
      }
    }
  }

  const jsonLdBlocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  if (jsonLdBlocks.length !== 0)
    throw new Error(
      `Public noindex preview must not emit JSON-LD: ${routeFor(file)}`,
    );
  structuredDataBlockCount += jsonLdBlocks.length;
  for (const match of jsonLdBlocks) {
    try {
      JSON.parse(match[1] ?? '');
    } catch {
      throw new Error(`Invalid JSON-LD: ${routeFor(file)}`);
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
    ...html.matchAll(/<script[^>]*\bsrc="(?:(?:https?:)?\/\/[^"]+)"/gi),
  ].length;

  for (const match of html.matchAll(/(?:src|srcset)="([^"]+)"/gi)) {
    for (const candidate of (match[1] ?? '').split(',')) {
      const path = candidate.trim().split(/\s+/, 1)[0];
      if (path?.startsWith('/')) referencedAssetPaths.add(path);
    }
  }

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
      throw new Error(`Broken internal link ${href} in ${routeFor(file)}.`);
  }
}

for (const asset of activeAssets) {
  if (!renderedMediaIds.has(asset.assetId))
    throw new Error(`Registered active media is orphaned: ${asset.assetId}.`);
}
for (const assetPath of referencedAssetPaths) {
  const localPath = join(dist, assetPath.replace(/^\//, ''));
  if (!existsSync(localPath))
    throw new Error(`Broken built asset request: ${assetPath}.`);
}

const recipePages = contentHtmlFiles.filter((file) => {
  const route = routeFor(file);
  return route.startsWith('recipes/') && route.split('/').length === 4;
});
if (recipePages.length !== 80)
  throw new Error(`Expected 80 recipe pages; found ${recipePages.length}.`);
for (const file of recipePages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('data-asset-status="synthetic-labeled"'))
    throw new Error(`Missing approved labeled recipe media: ${routeFor(file)}`);
  if (!/<picture\b/i.test(html) || !/<img\b/i.test(html))
    throw new Error(`Missing responsive recipe image: ${routeFor(file)}`);
  if (!/type="image\/webp"/i.test(html))
    throw new Error(`Missing modern recipe image format: ${routeFor(file)}`);
  if (!/loading="eager"/i.test(html) || !/fetchpriority="high"/i.test(html))
    throw new Error(`Recipe hero is not prioritized: ${routeFor(file)}`);
  if (/<video\b/i.test(html))
    throw new Error(`Unapproved video markup: ${routeFor(file)}`);
  if (!html.includes('<noscript>'))
    throw new Error(`Missing no-JavaScript print fallback: ${routeFor(file)}`);
  if (!html.includes('Safety controls that stay visible'))
    throw new Error(`Missing visible safety section: ${routeFor(file)}`);
  const linkedData = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1] ?? '{}'));
  if (linkedData.some((item) => item['@type'] === 'Recipe'))
    throw new Error(
      `Unpublished preview must not emit Recipe JSON-LD: ${routeFor(file)}`,
    );
  if (linkedData.length !== 0)
    throw new Error(
      `Unpublished preview must not emit recipe-page JSON-LD: ${routeFor(file)}`,
    );
}

const guidePages = contentHtmlFiles.filter((file) => {
  const route = routeFor(file);
  return route.startsWith('guides/') && route.split('/').length === 3;
});
if (guidePages.length !== 12)
  throw new Error(`Expected 12 guide pages; found ${guidePages.length}.`);
for (const file of guidePages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('Safety controls that stay visible'))
    throw new Error(`Missing guide safety review: ${routeFor(file)}`);
  if (!html.includes('Draft G'))
    throw new Error(`Missing guide draft identity: ${routeFor(file)}`);
}

const menuPages = contentHtmlFiles.filter((file) =>
  /^menus\/(2|4|8)-guests\/index\.html$/.test(routeFor(file)),
);
if (menuPages.length !== 3)
  throw new Error(`Expected 3 menu pages; found ${menuPages.length}.`);
for (const file of menuPages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('Consolidated planning list'))
    throw new Error(`Missing menu shopping list: ${routeFor(file)}`);
  if (!html.includes('Guest count does not change safety limits'))
    throw new Error(`Missing menu safety limit: ${routeFor(file)}`);
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
  'sitemap.xml',
  'sitemap-index.xml',
  'feed.xml',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  '_redirects',
];
for (const artifact of requiredArtifacts) {
  if (!existsSync(join(dist, artifact)))
    throw new Error(`Missing discovery artifact: ${artifact}`);
}
const redirects = readFileSync(join(dist, '_redirects'), 'utf8');
if (!/^\/privacy\/\s+\/privacy-policy\/\s+301$/m.test(redirects))
  throw new Error('Missing permanent /privacy/ to /privacy-policy/ redirect.');
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Allow: /'))
  throw new Error(
    'Public noindex preview robots.txt must allow crawlers to observe page-level noindex directives.',
  );
if (robots.includes('Sitemap:'))
  throw new Error('Preview robots.txt must not advertise a public sitemap.');
if (existsSync(join(dist, 'sitemap-preview.xml')))
  throw new Error('Preview sitemap inventory must not be emitted.');
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
const sitemapEligibleUrls = new Set(
  urlRegistry.entries
    .filter((entry) => entry.type === 'recipe')
    .map((entry) => entry.canonicalUrl),
);
for (const location of sitemapLocations) {
  if (!sitemapEligibleUrls.has(location))
    throw new Error(`Sitemap exposes a non-recipe or unknown URL: ${location}`);
}
if (new Set(sitemapLocations).size !== sitemapLocations.length)
  throw new Error('Sitemap contains duplicate URLs.');
const sitemapIndex = readFileSync(join(dist, 'sitemap-index.xml'), 'utf8');
if (/<loc>[^<]+<\/loc>/.test(sitemapIndex))
  throw new Error('Preview sitemap index must not advertise a public sitemap.');
const feed = readFileSync(join(dist, 'feed.xml'), 'utf8');
if (/<entry[\s>]/.test(feed))
  throw new Error('Preview feed must not claim unapproved published entries.');
if (existsSync(join(dist, 'site.webmanifest')))
  throw new Error('PWA manifest must not be emitted without offline support.');
if (
  JSON.stringify(pngDimensions(join(dist, 'favicon-32.png'))) !==
  JSON.stringify({ width: 32, height: 32 })
)
  throw new Error('favicon-32.png must be exactly 32×32 pixels.');
if (
  JSON.stringify(pngDimensions(join(dist, 'apple-touch-icon.png'))) !==
  JSON.stringify({ width: 180, height: 180 })
)
  throw new Error('apple-touch-icon.png must be exactly 180×180 pixels.');

const cssFiles = files.filter((file) => extname(file) === '.css');
const jsFiles = files.filter((file) => extname(file) === '.js');
const imageFiles = files.filter((file) =>
  ['.avif', '.webp', '.jpg', '.jpeg', '.png'].includes(extname(file)),
);
const deliveredImageFiles = imageFiles.filter((file) =>
  referencedAssetPaths.has('/' + routeFor(file)),
);
const eagerCandidateRecords = [...eagerImageCandidates.values()].map(
  ({ assetPath, descriptors, scopes }) => {
    const file = join(dist, assetPath.replace(/^\//, ''));
    if (!existsSync(file))
      throw new Error(`Broken eager image candidate: ${assetPath}.`);
    const widths = [...descriptors]
      .map((descriptor) => Number.parseInt(descriptor.replace(/w$/, ''), 10))
      .filter((width) => Number.isFinite(width));
    if (widths.length === 0)
      throw new Error(
        `Eager image candidate has no measurable srcset width: ${assetPath}.`,
      );
    return {
      assetPath,
      width: Math.max(...widths),
      bytes: readFileSync(file).byteLength,
      scopes,
    };
  },
);
const mobileEagerCandidates = eagerCandidateRecords.filter(
  (candidate) =>
    candidate.scopes.has('mobile') || candidate.scopes.has('mobile-fallback'),
);
if (mobileEagerCandidates.length === 0)
  throw new Error('No mobile eager image candidate was emitted.');
if (mobileEagerCandidates.some((candidate) => candidate.width > 600))
  throw new Error(
    'A mobile eager image can select a source wider than 600px; this can bypass the 35 KB mobile budget on high-DPR devices.',
  );
const maxMobileHeroImageBytes = mobileEagerCandidates.reduce(
  (max, candidate) => Math.max(max, candidate.bytes),
  0,
);
const maxDesktopHeroImageBytes = eagerCandidateRecords.reduce(
  (max, candidate) => Math.max(max, candidate.bytes),
  0,
);
const avifFiles = deliveredImageFiles.filter(
  (file) => extname(file) === '.avif',
);
const webpFiles = deliveredImageFiles.filter(
  (file) => extname(file) === '.webp',
);
if (webpFiles.length === 0)
  throw new Error('Responsive build emitted no WebP assets.');
if (avifFiles.length !== 0)
  throw new Error(
    `Responsive image contract allows WebP plus JPEG only; found ${avifFiles.length} AVIF assets.`,
  );
const maxOptimizedImageBytes = deliveredImageFiles.reduce(
  (max, file) => Math.max(max, readFileSync(file).byteLength),
  0,
);
if (maxOptimizedImageBytes > 600 * 1024)
  throw new Error(
    `A delivered image exceeds 600 KB: ${maxOptimizedImageBytes} bytes.`,
  );
const compressedCss = cssFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0,
);
const sharedCssUncompressed = cssFiles.reduce(
  (total, file) => total + readFileSync(file).byteLength,
  0,
);
const compressedJs = jsFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0,
);
const firstPartyJavaScriptCompressed =
  compressedJs + maxCompressedInlineJavaScript;
const maxEstimatedInitialCompressedTransfer =
  maxCompressedHtml + compressedCss + firstPartyJavaScriptCompressed;
const maxEstimatedMobileInitialTransfer =
  maxEstimatedInitialCompressedTransfer + maxMobileHeroImageBytes;
if (thirdPartyScripts !== 0)
  throw new Error(
    `Third-party JavaScript is prohibited by the current zero-script contract; found ${thirdPartyScripts}.`,
  );
const performanceBudgetResult = evaluatePerformanceBudget({
  policy: performanceBudget,
  metrics: {
    compressedHtmlBytes: maxCompressedHtml,
    sharedCssUncompressedBytes: sharedCssUncompressed,
    firstPartyJavaScriptCompressedBytes: firstPartyJavaScriptCompressed,
    thirdPartyJavaScriptCompressedBytes: 0,
    mobileHeroImageBytes: maxMobileHeroImageBytes,
    desktopHeroImageBytes: maxDesktopHeroImageBytes,
  },
});
if (performanceBudgetResult.failures.length !== 0)
  throw new Error(
    `Performance budget failed: ${performanceBudgetResult.failures
      .map(({ metric, reasons }) => `${metric} (${reasons.join('; ')})`)
      .join(', ')}`,
  );
if (files.some((file) => /node_modules|\.map$/.test(file)))
  throw new Error('Build contains a source map or node_modules path.');

stdout.write(
  `${JSON.stringify({
    pages: contentHtmlFiles.length,
    errorDocument: '404.html',
    recipePages: recipePages.length,
    guidePages: guidePages.length,
    menuPages: menuPages.length,
    uniqueTitles: titles.size,
    uniqueCanonicals: canonicals.size,
    sitemapUrls: sitemapLocations.length,
    internalLinksChecked: internalLinkCount,
    outboundAnchors: outboundAnchorCount,
    structuredDataBlocks: structuredDataBlockCount,
    compressedCssBytes: compressedCss,
    sharedCssUncompressedBytes: sharedCssUncompressed,
    compressedExternalJavaScriptBytes: compressedJs,
    maxCompressedInlineJavaScriptBytes: maxCompressedInlineJavaScript,
    firstPartyJavaScriptCompressedBytes: firstPartyJavaScriptCompressed,
    thirdPartyJavaScriptCompressedBytes: 0,
    maxCompressedHtmlBytes: maxCompressedHtml,
    maxUncompressedHtmlBytes: maxUncompressedHtml,
    maxEstimatedInitialCompressedTransferBytes:
      maxEstimatedInitialCompressedTransfer,
    maxEstimatedMobileInitialTransferBytes: maxEstimatedMobileInitialTransfer,
    maxMobileHeroImageBytes,
    maxDesktopHeroImageBytes,
    thirdPartyScripts,
    registeredMediaAssets: activeAssets.length,
    immutableMediaRecords: manifest.assets.length,
    renderedMediaAssets: renderedMediaIds.size,
    optimizedImages: deliveredImageFiles.length,
    avifImages: avifFiles.length,
    webpImages: webpFiles.length,
    maxOptimizedImageBytes,
    performanceBudgetExceptionsUsed: performanceBudgetResult.exceptionsUsed,
  })}\n`,
);
