import { describe, expect, it, vi } from 'vitest';

import {
  approvedRecipeStructuredDataImageSet,
  recipeStructuredDataImageVariants,
} from '../src/lib/recipe-structured-data-images';

describe('P1 #7 — approved Recipe JSON-LD image derivatives', () => {
  it('fails closed for the current synthetic, unreviewed campaign assets', async () => {
    await expect(
      approvedRecipeStructuredDataImageSet('B01', ['B01-hero']),
    ).resolves.toBeNull();
  });

  it('returns exactly 1:1, 4:3, and 16:9 first-party JPEG URLs from approved evidence', async () => {
    const getImage = vi.fn(
      async (options: { width: number; height: number }) => ({
        src: `/_astro/b01-approved-${options.width}x${options.height}.jpg`,
      }),
    );

    vi.resetModules();
    vi.doMock('../src/lib/media', () => ({
      approvedRecipeStructuredDataMedia: () => [
        {
          image: { src: '/source/b01.jpg' },
          focalPoint: '50% 50%',
        },
      ],
    }));
    vi.doMock('astro:assets', () => ({ getImage }));

    try {
      const {
        approvedRecipeStructuredDataImageSet: buildImageSet,
        isApprovedRecipeStructuredDataImageSet,
      } = await import('../src/lib/recipe-structured-data-images');
      const imageSet = await buildImageSet('B01', ['B01-approved-hero']);

      expect(imageSet).toEqual({
        urls: [
          'https://kbbqguide.com/_astro/b01-approved-1200x1200.jpg',
          'https://kbbqguide.com/_astro/b01-approved-1200x900.jpg',
          'https://kbbqguide.com/_astro/b01-approved-1200x675.jpg',
        ],
      });
      expect(imageSet).not.toBeNull();
      if (imageSet === null) return;
      expect(Object.isFrozen(imageSet)).toBe(true);
      expect(Object.isFrozen(imageSet.urls)).toBe(true);
      expect(getImage).toHaveBeenCalledTimes(3);
      expect(
        getImage.mock.calls.map(([options]) => [options.width, options.height]),
      ).toEqual([
        [1200, 1200],
        [1200, 900],
        [1200, 675],
      ]);
      expect(isApprovedRecipeStructuredDataImageSet(imageSet, 'B01')).toBe(
        true,
      );
      expect(isApprovedRecipeStructuredDataImageSet(imageSet, 'M01')).toBe(
        false,
      );
      expect(
        isApprovedRecipeStructuredDataImageSet(
          {
            urls: imageSet.urls,
          },
          'B01',
        ),
      ).toBe(false);
    } finally {
      vi.doUnmock('../src/lib/media');
      vi.doUnmock('astro:assets');
      vi.resetModules();
    }
  });

  it('keeps the standardized high-resolution dimensions explicit', () => {
    expect(recipeStructuredDataImageVariants).toEqual([
      { width: 1200, height: 1200 },
      { width: 1200, height: 900 },
      { width: 1200, height: 675 },
    ]);
  });
});
