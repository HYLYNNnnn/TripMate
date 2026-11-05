import { useState, useCallback } from "react";

export default function useMapMarkers(mapRef) {
  const [markers, setMarkers] = useState([]);      // [{id, position, place}]
  const [selected, setSelected] = useState(null);  // Place data rendered inside the InfoWindow

  const clearMarkers = useCallback(() => setMarkers([]), []);

  const addFromPlace = useCallback((p, i = 0) => {
    if (!p?.geometry?.location) return;

    const toNum = (v) => (typeof v === "function" ? v() : v);
    const lat = toNum(p.geometry.location.lat);
    const lng = toNum(p.geometry.location.lng);

    const base = p.place_id || `${lat?.toFixed?.(6)},${lng?.toFixed?.(6)}`;
    const id = `${base}#${i}`; // Deduplicate within the current batch as a fallback

    setMarkers((prev) => [...prev, { id, position: { lat, lng }, place: p }]);
  }, []);

  const fitToPlaces = useCallback((places) => {
    if (!mapRef.current || !places?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    places.forEach(p => p?.location && bounds.extend(p.location));
    mapRef.current.fitBounds(bounds);
  }, [mapRef]);

  const zoomMapToPlace = useCallback((place) => {
    const { location } = place;

    if (location) {
      mapRef.current.setCenter({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(13);
    }
  }, [mapRef])

  return { markers, selected, setSelected, addFromPlace, clearMarkers, fitToPlaces, zoomMapToPlace };
}