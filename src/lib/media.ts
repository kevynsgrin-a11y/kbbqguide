import type { ImageMetadata } from 'astro';
import manifestData from '../../data/media-manifest.json';

export type MediaAssetStatus =
  | 'placeholder'
  | 'original-approved'
  | 'licensed-approved'
  | 'synthetic-labeled';

export interface MediaManifestAsset {
  assetId: string;
  kind: 'image';
  role: string;
  assetStatus: MediaAssetStatus;
  path: string;
  width: number;
  height: number;
  aspectRatio: string;
  focalPoint: string;
  mobileCrop: string;
  altDecision: 'informative' | 'decorative';
  altText: string;
  caption: string;
  credit: string;
  provenance: {
    creator: string;
    generatedAt: string;
    sourceRecord: string;
    promptBasis: string;
    disclosure: string;
  };
  rights: {
    source: string;
    scope: string;
    externalLicense: string | null;
  };
  qa: Record<string, string>;
  /** Human sign-off is distinct from automated implementation screening. */
  humanEditorialReview?: {
    status?: string;
  };
  /** Set by media:ingest when this asset has been superseded by a replacement. */
  status?: 'replaced';
  replacedBy?: string;
  supersedes?: string;
  ingestedBy?: string;
  ingestedDate?: string;
  imageFit?: 'contain';
  sourceImport?: {
    batch: string;
    label: string;
    sha256: string;
    masterSha256: string;
    width: number;
    height: number;
    transform: string;
    evidence: string;
  };
}

export interface ResolvedMedia extends MediaManifestAsset {
  image: ImageMetadata;
  focalPointClass: FocalPointClass;
  mobileCropClass: MobileCropClass;
}

export type FocalPointClass =
  | 'focal-50-50'
  | 'focal-54-50'
  | 'focal-56-50'
  | 'focal-56-52'
  | 'focal-58-48'
  | 'focal-58-50'
  | 'focal-58-52'
  | 'focal-60-50'
  | 'focal-62-48';

export type MobileCropClass =
  'mobile-center-safe' | 'mobile-subject-right' | 'mobile-people-right';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/media/**/*.jpg',
  { eager: true },
);

const imagesByManifestPath = new Map(
  Object.entries(modules).map(([path, module]) => [
    path.replace('../assets/media/', 'src/assets/media/'),
    module.default,
  ]),
);

const assets = (manifestData.assets ?? []) as MediaManifestAsset[];
const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]));

const focalPointClasses: Record<string, FocalPointClass> = {
  '50% 50%': 'focal-50-50',
  '54% 50%': 'focal-54-50',
  '56% 50%': 'focal-56-50',
  '56% 52%': 'focal-56-52',
  '58% 48%': 'focal-58-48',
  '58% 50%': 'focal-58-50',
  '58% 52%': 'focal-58-52',
  '60% 50%': 'focal-60-50',
  '62% 48%': 'focal-62-48',
};

const mobileCropClasses: Record<string, MobileCropClass> = {
  'center-safe': 'mobile-center-safe',
  'subject-right': 'mobile-subject-right',
  'people-right': 'mobile-people-right',
};

export function resolveMedia(mediaId: string): ResolvedMedia | null {
  let asset = assetsById.get(mediaId);
  // Follow the supersede chain (media:ingest marks the old entry replaced) so a
  // stable slot id keeps resolving to the current active asset.
  const seen = new Set<string>();
  while (asset && asset.status === 'replaced') {
    if (seen.has(asset.assetId))
      throw new Error(`Media replacement cycle at ${mediaId}`);
    seen.add(asset.assetId);
    const next = asset.replacedBy
      ? assetsById.get(asset.replacedBy)
      : undefined;
    if (!next) throw new Error(`Broken media replacement chain at ${mediaId}`);
    if (next.provenance.sourceRecord !== asset.provenance.sourceRecord)
      throw new Error(`Cross-record media replacement at ${mediaId}`);
    asset = next;
  }
  if (!asset || asset.assetStatus === 'placeholder') return null;
  const image = imagesByManifestPath.get(asset.path);
  if (!image)
    throw new Error(
      `Manifest asset ${asset.assetId} references missing image ${asset.path}`,
    );
  const focalPointClass = focalPointClasses[asset.focalPoint];
  const mobileCropClass = mobileCropClasses[asset.mobileCrop];
  if (!focalPointClass)
    throw new Error(
      `Manifest asset ${asset.assetId} has unsupported focal point ${asset.focalPoint}`,
    );
  if (!mobileCropClass)
    throw new Error(
      `Manifest asset ${asset.assetId} has unsupported mobile crop ${asset.mobileCrop}`,
    );
  return { ...asset, image, focalPointClass, mobileCropClass };
}

const structuredDataImageStatuses = new Set<MediaAssetStatus>([
  'original-approved',
  'licensed-approved',
]);
const licensePlaceholderPattern =
  /\{\{[^}]+\}\}|^\s*(?:tbd|todo|unknown|n\/a|none)\s*$/i;

function hasRequiredExternalLicense(
  assetStatus: MediaAssetStatus,
  externalLicense: string | null,
): boolean {
  return (
    assetStatus !== 'licensed-approved' ||
    (typeof externalLicense === 'string' &&
      externalLicense.trim().length >= 2 &&
      !licensePlaceholderPattern.test(externalLicense.trim()))
  );
}

/**
 * The shared runtime predicate for a recipe image claim. A licensed asset is
 * never public merely because its status says licensed: it must also carry the
 * actual license record that substantiates that status.
 */
export function isApprovedRecipeStructuredDataMedia(
  media: ResolvedMedia,
  recipeId: string,
): boolean {
  return (
    media.status !== 'replaced' &&
    media.role === 'finished-dish-hero' &&
    structuredDataImageStatuses.has(media.assetStatus) &&
    hasRequiredExternalLicense(
      media.assetStatus,
      media.rights.externalLicense,
    ) &&
    media.provenance.sourceRecord === recipeId &&
    media.altDecision === 'informative' &&
    media.altText.trim().length >= 20 &&
    media.humanEditorialReview?.status === 'approved'
  );
}

/**
 * Returns only real, reviewed finished-dish media that can substantiate a
 * public Recipe image claim. Synthetic, placeholder, replaced, decorative,
 * unreviewed, or cross-record assets intentionally never enter JSON-LD.
 */
export function approvedRecipeStructuredDataMedia(
  recipeId: string,
  mediaIds: readonly string[],
): readonly ResolvedMedia[] {
  const resolvedIds = new Set<string>();
  const approved: ResolvedMedia[] = [];

  for (const mediaId of mediaIds) {
    const media = resolveMedia(mediaId);
    if (
      media === null ||
      resolvedIds.has(media.assetId) ||
      !isApprovedRecipeStructuredDataMedia(media, recipeId)
    )
      continue;

    resolvedIds.add(media.assetId);
    approved.push(media);
  }

  return approved;
}

export function mediaAssetCount(): number {
  return assets.filter((asset) => asset.status !== 'replaced').length;
}
