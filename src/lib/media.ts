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
  const asset = assetsById.get(mediaId);
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

export function mediaAssetCount(): number {
  return assets.length;
}
