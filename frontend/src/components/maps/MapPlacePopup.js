import React from "react";
import { InfoWindow } from "@react-google-maps/api";

function getLatLng(location) {
  const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
  const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;
  return { lat, lng };
}

export default function MapPlacePopup({ selected, onClose, maxWidth = 240 }) {
  if (!selected?.geometry?.location) return null;

  const position = getLatLng(selected.geometry.location);
  const name = selected.name || "";
  const addr = selected.formatted_address || selected.vicinity || "";
  const rating = selected.rating;
  const total = selected.user_ratings_total || 0;

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div style={{ fontFamily: "system-ui, -apple-system, Arial", maxWidth }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
        {addr ? <div style={{ color: "#555", marginBottom: 4 }}>{addr}</div> : null}
        {rating != null ? <div style={{ color: "#111" }}>⭐ {rating} ({total})</div> : null}
      </div>
    </InfoWindow>
  );
}
