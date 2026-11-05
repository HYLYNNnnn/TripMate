const TYPE_COLLECTIONS = new Set(["geocode", "address", "establishment", "(regions)", "(cities)"]);

const uniqueStrings = (values = []) => [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];

// Translate the component's options to the existing AutocompleteService API.
export function buildAutocompleteRequest(input, options = {}) {
  const { includedPrimaryTypes, includedRegionCodes, locationBias, locationRestriction } = options;
  const request = { input };
  const types = uniqueStrings(includedPrimaryTypes);
  if (types.length > 5 || (types.length > 1 && types.some((type) => TYPE_COLLECTIONS.has(type)))) {
    throw new Error("Use up to five place types, or one legacy autocomplete type collection.");
  }
  if (types.length) request.types = types;
  const countries = uniqueStrings((includedRegionCodes || []).map((code) => code.toLowerCase()));
  if (countries.length > 5) {
    throw new Error("Legacy autocomplete supports up to five country restrictions.");
  }
  if (countries.length) request.componentRestrictions = { country: countries };
  if (locationBias) request.locationBias = locationBias;
  if (locationRestriction) request.locationRestriction = locationRestriction;
  return request;
}

// Legacy autocomplete has no exclusion field; apply it to returned prediction types.
export function filterAutocompletePredictions(predictions, options = {}) {
  const included = new Set(options.includedPrimaryTypes || []);
  const excluded = new Set(options.excludedPrimaryTypes || []);
  const hasConcreteTypes = included.size > 0 && ![...included].some((type) => TYPE_COLLECTIONS.has(type));
  return (predictions || []).filter((prediction) => {
    const types = prediction.types || [];
    if (types.some((type) => excluded.has(type))) return false;
    return !hasConcreteTypes || types.some((type) => included.has(type));
  });
}
