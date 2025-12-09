export interface GeocodedLocation {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string; // 'city', 'road', 'building', etc.
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

// Simple in-memory cache
const locationCache = new Map<string, GeocodedLocation[]>();

export const searchLocation = async (
  query: string,
  options?: {
    limit?: number;
    countryCode?: string;
    viewbox?: [number, number, number, number]; // west, north, east, south
  }
): Promise<GeocodedLocation[]> => {
  const cacheKey = `${query}-${options?.countryCode || 'bd'}-${options?.limit || 5}`;

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const params = new URLSearchParams({
    format: 'json',
    q: query,
    limit: String(options?.limit || 5),
    addressdetails: '1',
    countrycodes: options?.countryCode || 'bd', // Default to Bangladesh
    'accept-language': 'en',
  });

  if (options?.viewbox) {
    params.append('viewbox', options.viewbox.join(','));
    params.append('bounded', '1');
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'Park-Eazy-App/1.0', // Required by Nominatim policy
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();

    const results = data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));

    locationCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};

let lastRequestTime = 0;
const MIN_INTERVAL = 1000; // 1 second as per Nominatim's policy

export const geocodeWithRateLimit = async (
  query: string,
  options?: {
    limit?: number;
    countryCode?: string;
    viewbox?: [number, number, number, number];
  }
): Promise<GeocodedLocation[]> => {
  const cacheKey = `${query}-${options?.countryCode || 'bd'}-${options?.limit || 5}`;
  // Return cached result immediately if available, bypassing rate limit
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  lastRequestTime = Date.now();
  return searchLocation(query, options);
};

export const reverseGeocodeLocation = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Park-Eazy-App/1.0',
        },
      }
    );

    if (!response.ok) throw new Error('Reverse geocoding failed');

    const data = await response.json();
    return data.display_name || 'Unknown Location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Location unavailable';
  }
};