import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** A key-free map for the explicitly labeled demo; live mode keeps Google Maps. */
export default function DemoMap({ places, selected, onSelect }) {
  const host = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const previousIds = useRef("");
  useEffect(() => {
    const instance = L.map(host.current).setView([37.79, -122.43], 12);
    map.current = instance;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(host.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    const points = [];
    places.forEach((place, index) => {
      if (!place.location) return;
      const point = [place.location.lat, place.location.lng];
      points.push(point);
      const active = selected?.id === place.id;
      const color = active ? "#1262a9" : place.pinned ? "#ce4771" : "#19816d";
      const icon = L.divIcon({ className: "tripmate-marker", iconSize: [32, 32], iconAnchor: [16, 16],
        html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:${color};color:white;border:3px solid white;box-shadow:0 2px 8px #0004;font:bold 14px system-ui">${index + 1}</span>` });
      const label = document.createElement("div");
      label.textContent = place.name;
      L.marker(point, { icon, title: place.name }).bindTooltip(label).on("click", () => onSelect(place)).addTo(layer.current);
    });
    const ids = places.map(place => place.id).join(",");
    if (ids !== previousIds.current && points.length) {
      map.current.fitBounds(points, { padding: [36, 36], maxZoom: 13 });
      previousIds.current = ids;
    }
  }, [places, selected, onSelect]);
  useEffect(() => {
    if (selected?.location && map.current) {
      map.current.flyTo([selected.location.lat, selected.location.lng], 13, { duration: 0.4 });
    }
  }, [selected]);
  return <div ref={host} aria-label="Map of San Francisco attractions" style={{ width: "100%", height: "100%", minHeight: 320, zIndex: 0 }} />;
}
