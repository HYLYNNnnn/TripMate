function numericCoordinate(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function coordinatePair(latValue, lngValue) {
  const lat = numericCoordinate(latValue);
  const lng = numericCoordinate(lngValue);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function normalizePlaceCoordinates(place) {
  if (!place) return null;
  for (const location of [place.location, place.geometry?.location]) {
    if (!location) continue;
    const coordinates = coordinatePair(
      typeof location.lat === "function" ? location.lat() : location.lat,
      typeof location.lng === "function" ? location.lng() : location.lng
    );
    if (coordinates) return coordinates;
  }
  return coordinatePair(place.latitude, place.longitude);
}

export function levelFromPrediction(pred) {
  if (!pred) return 'unknown';
  const t = new Set(pred.types || []);
  if (t.has('country')) return 'country';
  if (t.has('administrative_area_level_1')) return 'state';
  if (t.has('administrative_area_level_2')) return 'county';
  if (t.has('locality') || t.has('postal_town')) return 'city';
  if (t.has('sublocality')) return 'district';
  if (t.has('neighborhood')) return 'neighborhood';
  if (t.has('postal_code')) return 'zip';
  return 'unknown';
}

export function defaultFilterOptions(predictions) {
  return (predictions || []).filter((x) => {
    const t = x?.types || [];
    return (
      t.includes("country") ||
      t.includes("administrative_area_level_1") ||
      t.includes("administrative_area_level_2") ||
      t.includes("locality") ||
      t.includes("postal_town")
    );
  });
}


export function levelLabel(level) {
  const map = {
    country: 'Country',
    state: 'State',
    county: 'County',
    city: 'City',
    district: 'District',
    neighborhood: 'Neighborhood',
    zip: 'ZIP',
    unknown: ''
  };
  return map[level] || '';
}

// Recommended zoom per level
export const ZOOM_BY_LEVEL = {
  country: 4,
  state: 6,
  county: 8,
  city: 11,
  district: 13,
  neighborhood: 14,
  street: 16,
  poi: 16,
  zip: 11,
  unknown: 12,
};

// Zoom to place: prefer viewport, fallback to level mapping
export function zoomMapToPlace(map, place, padding = 40) {
  const geom = place?.geometry;

  if (geom?.viewport) {
    // Viewport refers to LatLngBounds, providing more accurate fit (very useful for country/state/city levels)
    map.fitBounds(geom.viewport, padding);
    return;
  }

  if (geom?.location) {
    const level = levelFromPrediction(place);
    const zoom = ZOOM_BY_LEVEL[level] ?? ZOOM_BY_LEVEL.unknown;
    map.setCenter({ lat: geom.location.lat(), lng: geom.location.lng() });
    map.setZoom(zoom);
  }
}

/**
 * Remove duplicate places from a list.
 * 
 * Deduplication is based on:
 * - place_id if available
 * - otherwise a lat,lng key (rounded to 6 decimals)
 * 
 * Returns a new list containing only unique places.
 */
export function dedupPlaces(list) {
  const seen = new Set();
  const out = [];
  for (const p of list || []) {
    const loc = p.geometry?.location;
    const lat = typeof loc?.lat === "function" ? loc.lat() : loc?.lat;
    const lng = typeof loc?.lng === "function" ? loc.lng() : loc?.lng;

    const key = p.place_id || (lat != null && lng != null ? `${lat.toFixed(6)},${lng.toFixed(6)}` : null);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

