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
}

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

const aliases: Record<string, string> = {
  'HOME-hero': 'HOME-gathering-hero',
  'CAT_MEAT-hero': 'M01-hero',
  'CAT_SEAFOOD-hero': 'SF10-hero',
  'CAT_BANCHAN-hero': 'B01-hero',
  'CAT_FRESH-hero': 'F01-hero',
  'CAT_SAUCES-hero': 'SA01-hero',
  'CAT_DESSERTS-hero': 'D01-hero',
  'SYS_RECIPES-hero': 'B01-hero',
  'SYS_GUIDES-hero': 'HOME-gathering-hero',
  'SYS_MENUS-hero': 'M01-hero',
  'SYS_TOOLS-hero': 'B10-hero',
  'SYS_START-hero': 'HOME-gathering-hero',
  'SYS_SHOP-hero': 'SA01-hero',
  'G01-hero': 'HOME-gathering-hero',
  'G02-hero': 'M01-hero',
  'G03-hero': 'M05-hero',
  'G04-hero': 'SA01-hero',
  'G05-hero': 'M08-hero',
  'G06-hero': 'SF10-hero',
  'G07-hero': 'F01-hero',
  'G08-hero': 'HOME-gathering-hero',
  'G09-hero': 'B10-hero',
  'G10-hero': 'B01-hero',
  'G11-hero': 'M05-hero',
  'G12-hero': 'B07-hero',
  'MENU_2-hero': 'M03-hero',
  'MENU_4-hero': 'M01-hero',
  'MENU_8-hero': 'HOME-gathering-hero',
  'POLICY-hero': 'HOME-gathering-hero',
};

export function resolveMedia(mediaId: string): ResolvedMedia | null {
  const asset = assetsById.get(aliases[mediaId] ?? mediaId);
  if (!asset || asset.assetStatus === 'placeholder') return null;
  const image = imagesByManifestPath.get(asset.path);
  if (!image)
    throw new Error(
      `Manifest asset ${asset.assetId} references missing image ${asset.path}`,
    );
  return { ...asset, image };
}

export function mediaAssetCount(): number {
  return assets.length;
}
