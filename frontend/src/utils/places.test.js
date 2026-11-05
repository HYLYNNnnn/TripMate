import { buildAutocompleteRequest, filterAutocompletePredictions } from "./places";

test("sends supported legacy types and country restrictions without new-API-only fields", () => {
  const request = buildAutocompleteRequest("San", {
    includedPrimaryTypes: ["locality", "administrative_area_level_1", "country"],
    excludedPrimaryTypes: ["administrative_area_level_2"],
    includedRegionCodes: ["US", "CA", "CN", "JP", "US"],
  });
  expect(request).toEqual({
    input: "San",
    types: ["locality", "administrative_area_level_1", "country"],
    componentRestrictions: { country: ["us", "ca", "cn", "jp"] },
  });
});

test("preserves geographic bias and restriction options", () => {
  const locationBias = { radius: 1000, center: { lat: 0, lng: 0 } };
  const locationRestriction = { north: 1, south: -1, east: 1, west: -1 };
  expect(buildAutocompleteRequest("place", { locationBias, locationRestriction }))
    .toEqual({ input: "place", locationBias, locationRestriction });
});

test("excludes counties and other excluded prediction types while retaining allowed destinations", () => {
  const city = { place_id: "city", types: ["locality", "political"] };
  const country = { place_id: "country", types: ["country", "political"] };
  const county = { place_id: "county", types: ["administrative_area_level_2", "political"] };
  const restaurant = { place_id: "restaurant", types: ["restaurant", "food"] };
  expect(filterAutocompletePredictions([city, country, county, restaurant], {
    includedPrimaryTypes: ["locality", "country"],
    excludedPrimaryTypes: ["administrative_area_level_2"],
  })).toEqual([city, country]);
});

test("supports type collections without incorrectly filtering their member types", () => {
  const city = { types: ["locality"] };
  expect(buildAutocompleteRequest("Paris", { includedPrimaryTypes: ["(cities)"] }).types).toEqual(["(cities)"]);
  expect(filterAutocompletePredictions([city], { includedPrimaryTypes: ["(cities)"] })).toEqual([city]);
});

test("rejects combinations the legacy service would reject", () => {
  expect(() => buildAutocompleteRequest("test", { includedPrimaryTypes: ["(cities)", "country"] })).toThrow();
  expect(() => buildAutocompleteRequest("test", { includedRegionCodes: ["US", "CA", "CN", "JP", "GB", "FR"] })).toThrow();
});
