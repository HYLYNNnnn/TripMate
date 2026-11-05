import { useState, useEffect } from 'react';

/** Fetch an optional place photo without retaining results from an earlier place. */
export default function usePlacePhoto(place) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const name = place?.name;
  const address = place?.address;
  const latitude = place?.location?.lat;
  const longitude = place?.location?.lng;

  useEffect(() => {
    let active = true;
    setPhotoUrl(null);
    setError(null);
    const maps = window.google?.maps;
    if (!name || !maps?.places) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    const service = new maps.places.PlacesService(document.createElement('div'));
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
    const request = {
      query: `${name} ${address || ''}`,
      location: hasLocation ? new maps.LatLng(latitude, longitude) : undefined,
      radius: 1000,
    };
    service.textSearch(request, (results, status) => {
      if (!active) return;
      if (status !== maps.places.PlacesServiceStatus.OK || !results?.[0]) {
        setLoading(false);
        setError('Place not found');
        return;
      }
      service.getDetails({ placeId: results[0].place_id, fields: ['photos'] }, (details, detailStatus) => {
        if (!active) return;
        setLoading(false);
        if (detailStatus === maps.places.PlacesServiceStatus.OK && details?.photos?.length) {
          setPhotoUrl(details.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 }));
        } else {
          setError('No photos found for this place');
        }
      });
    });
    return () => { active = false; };
  }, [name, address, latitude, longitude]);

  return { photoUrl, loading, error };
}
