export type LocationSuggestion = {
  displayName: string;
  country: string;
  countryCode: string;
  state?: string;
  city?: string;
  postalCode?: string;
  type: string;
};

const cache = new Map<string, LocationSuggestion[]>();
let activeController: AbortController | null = null;

export async function searchLocations(query: string, countryCode?: string): Promise<LocationSuggestion[]> {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  const key = `${countryCode ?? ''}:${normalized}`;
  const cached = cache.get(key);
  if (cached) return cached;

  activeController?.abort();
  activeController = new AbortController();
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    'accept-language': 'en',
  });
  if (countryCode) params.set('countrycodes', countryCode.toLowerCase());

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: activeController.signal,
  });
  if (!response.ok) throw new Error('Location search is temporarily unavailable.');
  const results: { display_name?: string; type?: string; address?: Record<string, string> }[] = await response.json();
  const suggestions = results.map((result) => {
    const address = result.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality;
    return {
      displayName: result.display_name ?? query.trim(),
      country: address.country ?? '',
      countryCode: (address.country_code ?? '').toUpperCase(),
      state: address.state ?? address.region ?? address.county,
      city,
      postalCode: address.postcode,
      type: result.type ?? 'location',
    };
  });
  cache.set(key, suggestions);
  return suggestions;
}
