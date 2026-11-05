import { normalizePlaceCoordinates } from "./map";

test("preserves valid zero latitude and longitude", () => {
  expect(normalizePlaceCoordinates({ location: { lat: 0, lng: 0 } })).toEqual({ lat: 0, lng: 0 });
  expect(normalizePlaceCoordinates({ location: { lat: 51.48, lng: 0 } })).toEqual({ lat: 51.48, lng: 0 });
});

test("uses top-level coordinates supplied by mock or API data", () => {
  expect(normalizePlaceCoordinates({ latitude: 37.8199, longitude: -122.4783 }))
    .toEqual({ lat: 37.8199, lng: -122.4783 });
  expect(normalizePlaceCoordinates({ location: {}, latitude: "0", longitude: "2.5" }))
    .toEqual({ lat: 0, lng: 2.5 });
});

test("supports Google geometry objects without losing the method receiver", () => {
  const location = { latitude: 1, longitude: 2, lat() { return this.latitude; }, lng() { return this.longitude; } };
  expect(normalizePlaceCoordinates({ geometry: { location } })).toEqual({ lat: 1, lng: 2 });
});

test.each([
  null,
  {},
  { location: { lat: null, lng: 1 } },
  { location: { lat: "", lng: 1 } },
  { latitude: Number.NaN, longitude: 1 },
  { latitude: 91, longitude: 1 },
  { latitude: 0, longitude: 181 },
])("does not invent coordinates for invalid location %p", (place) => {
  expect(normalizePlaceCoordinates(place)).toBeNull();
});
