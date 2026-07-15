export interface MerchantRecord {
  readonly id: string;
  readonly status: 'not-applied' | 'pending' | 'approved' | 'suspended';
  readonly approvedDomains: readonly string[];
  readonly affiliateId: string | null;
  readonly approvedParameterNames: readonly string[];
  readonly termsVerifiedAt: string | null;
  readonly affiliateBuilder: 'query-parameters' | null;
  readonly affiliateIdParameterName: string | null;
}

export function buildAffiliateUrl(
  merchant: MerchantRecord,
  cleanDestination: string,
  parameters: Readonly<Record<string, string>>,
): string {
  if (
    merchant.status !== 'approved' ||
    !merchant.affiliateId ||
    !merchant.termsVerifiedAt ||
    merchant.affiliateBuilder !== 'query-parameters' ||
    !merchant.affiliateIdParameterName
  ) {
    throw new Error(
      `Merchant ${merchant.id} is not approved for active affiliate links.`,
    );
  }

  let url: InstanceType<typeof globalThis.URL>;
  try {
    url = new globalThis.URL(cleanDestination);
  } catch {
    throw new Error('Affiliate destination must be a valid absolute URL.');
  }
  if (url.protocol !== 'https:')
    throw new Error('Affiliate destinations must use HTTPS.');
  if (url.username || url.password || url.port)
    throw new Error(
      'Affiliate destinations cannot contain credentials or ports.',
    );
  if (url.search || url.hash)
    throw new Error(
      'Clean affiliate destinations cannot contain a query or fragment.',
    );
  if (!merchant.approvedDomains.includes(url.hostname)) {
    throw new Error(
      `Destination domain is not approved for merchant ${merchant.id}.`,
    );
  }

  for (const [name, value] of Object.entries(parameters)) {
    if (name === merchant.affiliateIdParameterName)
      throw new Error(
        'The affiliate ID parameter is controlled by the registry.',
      );
    if (!merchant.approvedParameterNames.includes(name)) {
      throw new Error(`Affiliate parameter is not approved: ${name}`);
    }
    if (!value || /[\r\n]/.test(value))
      throw new Error(`Affiliate parameter has an invalid value: ${name}`);
    url.searchParams.set(name, value);
  }

  if (
    !merchant.approvedParameterNames.includes(merchant.affiliateIdParameterName)
  )
    throw new Error('The affiliate ID parameter is not approved.');
  url.searchParams.set(merchant.affiliateIdParameterName, merchant.affiliateId);

  return url.toString();
}
