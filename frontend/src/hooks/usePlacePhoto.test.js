import { act, renderHook } from '@testing-library/react';
import usePlacePhoto from './usePlacePhoto';

let searches;
let details;
let service;
const originalGoogle = window.google;

beforeEach(() => {
  searches = [];
  details = [];
  service = {
    textSearch: jest.fn((request, callback) => searches.push({ request, callback })),
    getDetails: jest.fn((request, callback) => details.push({ request, callback })),
  };
  window.google = { maps: {
    LatLng: jest.fn(function(lat, lng) { this.lat = lat; this.lng = lng; }),
    places: {
      PlacesService: jest.fn(function() { return service; }),
      PlacesServiceStatus: { OK: 'OK' },
    },
  } };
});

afterEach(() => { window.google = originalGoogle; });

function finishPhoto(searchIndex, url) {
  act(() => searches[searchIndex].callback([{ place_id: `place-${searchIndex}` }], 'OK'));
  const detail = details[details.length - 1];
  act(() => detail.callback({ photos: [{ getUrl: () => url }] }, 'OK'));
}

test('ignores late photo responses for an earlier place', () => {
  const { result, rerender } = renderHook(({ place }) => usePlacePhoto(place), {
    initialProps: { place: { name: 'First place', location: { lat: 0, lng: 0 } } },
  });
  expect(window.google.maps.LatLng).toHaveBeenCalledWith(0, 0);
  act(() => searches[0].callback([{ place_id: 'first' }], 'OK'));
  const oldDetail = details[0];
  rerender({ place: { name: 'Second place', location: { lat: 1, lng: 1 } } });
  finishPhoto(1, 'second-photo');
  act(() => oldDetail.callback({ photos: [{ getUrl: () => 'stale-photo' }] }, 'OK'));
  expect(result.current.photoUrl).toBe('second-photo');
});

test('does not repeat photo requests when only the wrapper object changes', () => {
  const { rerender } = renderHook(({ place }) => usePlacePhoto(place), {
    initialProps: { place: { name: 'Same place', address: 'Same address', location: { lat: 2, lng: 3 } } },
  });
  rerender({ place: { name: 'Same place', address: 'Same address', location: { lat: 2, lng: 3 } } });
  expect(service.textSearch).toHaveBeenCalledTimes(1);
});

test('clears a previous photo when the place is removed', () => {
  const { result, rerender } = renderHook(({ place }) => usePlacePhoto(place), {
    initialProps: { place: { name: 'A place' } },
  });
  finishPhoto(0, 'photo');
  expect(result.current.photoUrl).toBe('photo');
  rerender({ place: null });
  expect(result.current.photoUrl).toBeNull();
  expect(result.current.loading).toBe(false);
});
