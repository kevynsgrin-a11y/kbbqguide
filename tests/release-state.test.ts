import { describe, expect, it } from 'vitest';

import { resolveReleaseState } from '../src/lib/release-state';

describe('release-state safety boundary', () => {
  it('defaults an absent configuration to a truthful non-indexable public preview', () => {
    expect(resolveReleaseState()).toMatchObject({
      mode: 'public-noindex-preview',
      requiresEdgeAuthentication: false,
      isIndexable: false,
      exposesXmlSitemap: false,
      metaRobots: 'noindex,nofollow,noarchive',
      robotsPolicy: 'allow-all',
    });
  });

  it('does not allow a restricted-preview label to substitute for verified edge authentication', () => {
    const state = resolveReleaseState({
      mode: 'restricted-preview',
      accessControl: 'cloudflare-access',
    });

    expect(state).toMatchObject({
      mode: 'public-noindex-preview',
      isIndexable: false,
      exposesXmlSitemap: false,
    });
    expect(state.blockers).toContain(
      'Restricted preview requires verified Cloudflare Access or HTTP basic auth at the edge.',
    );
  });

  it('keeps a verified restricted preview out of discovery surfaces', () => {
    expect(
      resolveReleaseState({
        mode: 'restricted-preview',
        accessControl: 'cloudflare-access',
        accessVerified: 'verified',
      }),
    ).toMatchObject({
      mode: 'restricted-preview',
      accessControl: 'cloudflare-access',
      requiresEdgeAuthentication: true,
      isIndexable: false,
      exposesXmlSitemap: false,
      robotsPolicy: 'disallow-all',
    });
  });

  it('fails closed when public launch or indexing approval is missing', () => {
    const state = resolveReleaseState({
      mode: 'public-launch',
      publicReleaseApproved: 'approved',
    });

    expect(state.mode).toBe('public-noindex-preview');
    expect(state.isIndexable).toBe(false);
    expect(state.robotsPolicy).toBe('allow-all');
    expect(state.blockers).toContain(
      'Indexing approval is required before crawlers are invited.',
    );
  });

  it('allows crawler discovery only after both independent approvals are explicit', () => {
    expect(
      resolveReleaseState({
        mode: 'public-launch',
        publicReleaseApproved: 'approved',
        indexingApproved: 'approved',
      }),
    ).toMatchObject({
      mode: 'public-launch',
      requiresEdgeAuthentication: false,
      isIndexable: true,
      exposesXmlSitemap: true,
      metaRobots: 'index,follow',
      robotsPolicy: 'allow-all',
      blockers: [],
    });
  });
});
