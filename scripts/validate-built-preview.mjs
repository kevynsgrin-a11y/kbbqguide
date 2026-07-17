import { gzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { stdout } from 'node:process';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'data/media-manifest.json'), 'utf8'),
);
const allowedActiveStatuses = new Set([
  'original-approved',
  'licensed-approved',
  'synthetic-labeled',
]);
const manifestAssetsById = new Map(
  manifest.assets.map((asset) => [asset.assetId, asset]),
);
if (manifestAssetsById.size !== manifest.assets.length)
  throw new Error('Media manifest contains duplicate immutable asset IDs.');
for (const asset of manifest.assets) {
  if (!allowedActiveStatuses.has(asset.assetStatus))
    throw new Error(
      `Active asset ${asset.assetId} has unapproved status ${asset.assetStatus}.`,
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
const referencedAssetPaths = new Set();
const renderedMediaIds = new Set();
const eagerImageCandidates = new Map();
const routesWithoutLcpMedia = new Set([
  'affiliate-disclosure/index.html',
  'sponsored-content-policy/index.html',
  'sitemap/index.html',
]);
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = relative(dist, file);
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
  if (/\sstyle\s*=/i.test(html))
    throw new Error(`Inline style attribute: ${relative(dist, file)}`);
  if (/<(?:img|source)[^>]+(?:src|srcset)="(?:https?:)?\/\//i.test(html))
    throw new Error(`Remote or hotlinked image: ${relative(dist, file)}`);

  const renderedIds = [...html.matchAll(/data-media-id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  for (const mediaId of renderedIds) {
    const asset = manifestAssetsById.get(mediaId);
    if (!asset)
      throw new Error(`Unregistered rendered media ${mediaId} in ${route}.`);
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
    for (const match of markup.matchAll(/(?:src|srcset)="([^"]+)"/gi)) {
      for (const candidate of (match[1] ?? '').split(',')) {
        const [path, descriptor = ''] = candidate.trim().split(/\s+/, 2);
        if (path?.startsWith('/')) eagerImageCandidates.set(path, descriptor);
      }
    }
  }

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
      throw new Error(
        `Broken internal link ${href} in ${relative(dist, file)}.`,
      );
  }
}

for (const asset of manifest.assets) {
  if (!renderedMediaIds.has(asset.assetId))
    throw new Error(`Registered active media is orphaned: ${asset.assetId}.`);
}
for (const assetPath of referencedAssetPaths) {
  const localPath = join(dist, assetPath.replace(/^\//, ''));
  if (!existsSync(localPath))
    throw new Error(`Broken built asset request: ${assetPath}.`);
}

const recipePages = htmlFiles.filter((file) => {
  const route = relative(dist, file);
  return route.startsWith('recipes/') && route.split('/').length === 4;
});
if (recipePages.length !== 80)
  throw new Error(`Expected 80 recipe pages; found ${recipePages.length}.`);
for (const file of recipePages) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('data-asset-status="synthetic-labeled"'))
    throw new Error(
      `Missing approved labeled recipe media: ${relative(dist, file)}`,
    );
  if (!/<picture\b/i.test(html) || !/<img\b/i.test(html))
    throw new Error(`Missing responsive recipe image: ${relative(dist, file)}`);
  if (!/type="image\/avif"/i.test(html) || !/type="image\/webp"/i.test(html))
    throw new Error(
      `Missing modern recipe image formats: ${relative(dist, file)}`,
    );
  if (!/loading="eager"/i.test(html) || !/fetchpriority="high"/i.test(html))
    throw new Error(`Recipe hero is not prioritized: ${relative(dist, file)}`);
  if (/<video\b/i.test(html))
    throw new Error(`Unapproved video markup: ${relative(dist, file)}`);
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
const imageFiles = files.filter((file) =>
  ['.avif', '.webp', '.jpg', '.jpeg', '.png'].includes(extname(file)),
);
const deliveredImageFiles = imageFiles.filter((file) =>
  referencedAssetPaths.has('/' + relative(dist, file)),
);
const eagerCandidateRecords = [...eagerImageCandidates].map(
  ([assetPath, descriptor]) => {
    const file = join(dist, assetPath.replace(/^\//, ''));
    if (!existsSync(file))
      throw new Error(`Broken eager image candidate: ${assetPath}.`);
    return {
      assetPath,
      width: Number.parseInt(descriptor.replace(/w$/, ''), 10) || null,
      bytes: readFileSync(file).byteLength,
    };
  },
);
const mobileEagerCandidates = eagerCandidateRecords.filter(
  (candidate) => candidate.width !== null && candidate.width <= 640,
);
if (mobileEagerCandidates.length === 0)
  throw new Error('No mobile eager image candidate was emitted.');
const maxMobileHeroImageBytes = mobileEagerCandidates.reduce(
  (max, candidate) => Math.max(max, candidate.bytes),
  0,
);
const maxDesktopHeroImageBytes = eagerCandidateRecords.reduce(
  (max, candidate) => Math.max(max, candidate.bytes),
  0,
);
if (maxMobileHeroImageBytes > 350 * 1024)
  throw new Error(
    `A mobile hero candidate exceeds 350 KB: ${maxMobileHeroImageBytes} bytes.`,
  );
if (maxDesktopHeroImageBytes > 600 * 1024)
  throw new Error(
    `A desktop hero candidate exceeds 600 KB: ${maxDesktopHeroImageBytes} bytes.`,
  );
const avifFiles = deliveredImageFiles.filter(
  (file) => extname(file) === '.avif',
);
const webpFiles = deliveredImageFiles.filter(
  (file) => extname(file) === '.webp',
);
if (avifFiles.length === 0 || webpFiles.length === 0)
  throw new Error('Responsive build emitted no AVIF or WebP assets.');
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
const compressedJs = jsFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(file)).byteLength,
  0,
);
const maxEstimatedInitialCompressedTransfer =
  maxCompressedHtml + compressedCss + compressedJs;
const maxEstimatedMobileInitialTransfer =
  maxEstimatedInitialCompressedTransfer + maxMobileHeroImageBytes;
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
if (maxEstimatedMobileInitialTransfer > 900 * 1024)
  throw new Error(
    `Estimated mobile initial transfer exceeds 900 KB: ${maxEstimatedMobileInitialTransfer} bytes.`,
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
    maxEstimatedMobileInitialTransferBytes: maxEstimatedMobileInitialTransfer,
    maxMobileHeroImageBytes,
    maxDesktopHeroImageBytes,
    thirdPartyScripts,
    registeredMediaAssets: manifest.assets.length,
    renderedMediaAssets: renderedMediaIds.size,
    optimizedImages: deliveredImageFiles.length,
    avifImages: avifFiles.length,
    webpImages: webpFiles.length,
    maxOptimizedImageBytes,
  })}\n`,
);
