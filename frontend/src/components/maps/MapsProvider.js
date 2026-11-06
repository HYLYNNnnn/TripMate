import { useJsApiLoader } from "@react-google-maps/api";
import { DEMO_MODE } from "../../config";

const LIBRARIES = ["places"];

export default function MapsProvider({ children }) {
  return DEMO_MODE ? children : <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}

function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_MAPS_BROWSER_KEY,
    libraries: LIBRARIES,
  });

  if (loadError) return <div>Failed to load Google Maps</div>;

  if (!isLoaded) return <div>Loading map services…</div>;

  return children;
}
