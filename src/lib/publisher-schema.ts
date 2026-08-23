import {
  approvedPrivacyNoticeOrNull,
  type ApprovedPrivacyNotice,
} from './privacy-notice';
import { isActualPublicationText } from './publication-governance';
import { canonicalUrl, siteOrigin } from './seo';

const websiteUrl = canonicalUrl('/');
const organizationId = `${siteOrigin}/#organization`;
const websiteId = `${siteOrigin}/#website`;

export interface PublisherWebSiteJsonLd {
  readonly '@context': 'https://schema.org';
  readonly '@graph': readonly [
    {
      readonly '@type': 'Organization';
      readonly '@id': string;
      readonly name: string;
      readonly url: string;
    },
    {
      readonly '@type': 'WebSite';
      readonly '@id': string;
      readonly name: 'KBBQGuide';
      readonly url: string;
      readonly inLanguage: 'en';
      readonly publisher: { readonly '@id': string };
    },
  ];
}

/**
 * Produces the publisher identity graph from a verified legal operator only.
 * A logo, email, postal address, and social profiles are intentionally absent
 * until they have their own factual data and asset approval.
 */
export function publisherWebSiteJsonLdFrom(
  notice: Pick<ApprovedPrivacyNotice, 'legalOperatorName'> | null,
): PublisherWebSiteJsonLd | null {
  if (!notice || !isActualPublicationText(notice.legalOperatorName))
    return null;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: notice.legalOperatorName,
        url: websiteUrl,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'KBBQGuide',
        url: websiteUrl,
        inLanguage: 'en',
        publisher: { '@id': organizationId },
      },
    ],
  };
}

/**
 * Public build entry point. It remains null while the privacy notice is
 * incomplete or blocked, preventing a guessed operator from entering JSON-LD.
 */
export function publisherWebSiteJsonLd(): PublisherWebSiteJsonLd | null {
  return publisherWebSiteJsonLdFrom(approvedPrivacyNoticeOrNull());
}
