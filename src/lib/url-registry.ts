export interface UrlRegistryEntry {
  readonly id: string;
  readonly type: 'system' | 'category' | 'guide' | 'policy' | 'recipe';
  readonly title: string;
  readonly slug: string;
  readonly path: string;
  readonly canonicalUrl: string;
  readonly status: 'locked' | 'reserved' | 'redirected';
  readonly indexable: boolean;
}

export interface UrlRegistry {
  readonly trailingSlash: 'always';
  readonly baseUrl: string;
  readonly entries: readonly UrlRegistryEntry[];
  readonly redirects: readonly { from: string; toId: string }[];
}

const reservedNames = new Set([
  'admin',
  'api',
  'assets',
  'cdn-cgi',
  'favicon',
  'robots',
  'sitemap',
  'static',
]);

export function normalizeSlug(input: string): string {
  const withoutQueryOrFragment = input.split(/[?#]/, 1)[0] ?? '';
  const normalized = withoutQueryOrFragment
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!normalized) throw new Error('Slug cannot be empty after normalization.');
  if (reservedNames.has(normalized))
    throw new Error(`Reserved slug: ${normalized}`);
  if (normalized.includes('..'))
    throw new Error('Slug cannot contain path traversal tokens.');
  if (/\.[a-z0-9]{1,8}$/i.test(normalized))
    throw new Error('Slug cannot end in a file extension.');
  return normalized;
}

export function registryPathById(registry: UrlRegistry, id: string): string {
  const matches = registry.entries.filter((entry) => entry.id === id);
  if (matches.length !== 1)
    throw new Error(`Expected one URL registry entry for ID ${id}.`);
  const entry = matches[0];
  if (!entry) throw new Error(`Missing URL registry entry for ID ${id}.`);
  return entry.path;
}

export function validateUrlRegistry(registry: UrlRegistry): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();
  const canonicals = new Set<string>();

  for (const entry of registry.entries) {
    if (ids.has(entry.id)) errors.push(`Duplicate ID: ${entry.id}`);
    if (paths.has(entry.path)) errors.push(`Duplicate path: ${entry.path}`);
    if (canonicals.has(entry.canonicalUrl))
      errors.push(`Duplicate canonical: ${entry.canonicalUrl}`);
    ids.add(entry.id);
    paths.add(entry.path);
    canonicals.add(entry.canonicalUrl);

    if (!entry.path.startsWith('/') || !entry.path.endsWith('/')) {
      errors.push(`Path must use leading and trailing slashes: ${entry.path}`);
    }
    if (entry.path.includes('//') || entry.path.includes('..')) {
      errors.push(`Unsafe path: ${entry.path}`);
    }
    if (!entry.canonicalUrl.startsWith(`${registry.baseUrl}/`)) {
      errors.push(`Canonical is outside the base URL: ${entry.canonicalUrl}`);
    }
  }

  return errors;
}
