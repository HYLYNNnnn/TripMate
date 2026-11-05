import { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import PageContainer from "../../layouts/PageContainer";
import AttractionsList from "../../components/attraction/AttractionsList";
import { MapCanvas, MapPlacePopup, PlaceMarker } from "../../components/maps";
import useMapMarkers from "../../hooks/useMapMarkers";
import { getItineraryById, getItineraryRecommendations, updateInterest, planItinerary } from "../../api";
import { normalizePlaceCoordinates } from "../../utils/map";
import { markerIcon, blueMarkerIcon, redMarkerIcon } from "../../assets";
import ItineraryTimeline from "../../components/ItineraryTimeline";

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

function calculateMapCenter(places) {
  const coordinates = places.map(normalizePlaceCoordinates).filter(Boolean);
  if (!coordinates.length) return DEFAULT_CENTER;
  return {
    lat: coordinates.reduce((sum, location) => sum + location.lat, 0) / coordinates.length,
    lng: coordinates.reduce((sum, location) => sum + location.lng, 0) / coordinates.length,
  };
}

export default function PlanDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapRef = useRef(null);
  const itineraryVersion = useRef(0);
  const pendingInterests = useRef(new Map());
  const [destination, setDestination] = useState("");
  const [attractions, setAttractions] = useState([]);
  const [interests, setInterests] = useState([]);
  const [updatingInterests, setUpdatingInterests] = useState(0);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState();
  const [displayPlan, setDisplayPlan] = useState(false);
  const [err, setErr] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);

  const {
    markers, selected, setSelected, addFromPlace, clearMarkers, fitToPlaces, zoomMapToPlace,
  } = useMapMarkers(mapRef);

  const onMapLoad = (map) => {
    mapRef.current = map;
    fitToPlaces(attractions.filter((place) => place.location));
  };

  // Keep the header query in sync without refetching the same itinerary.
  useEffect(() => {
    if (!destination || searchParams.get("destination") === destination) return;
    const next = new URLSearchParams(searchParams);
    next.set("destination", destination);
    setSearchParams(next, { replace: true });
  }, [destination, searchParams, setSearchParams]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    itineraryVersion.current += 1;
    pendingInterests.current.clear();
    setUpdatingInterests(0);
    setDestination("");
    setInterests([]);
    setPlan(undefined);
    setDisplayPlan(false);
    setSelectedAttraction(null);
    setSelected(null);

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        setAttractions([]);
        clearMarkers();
        const [itineraryData, recommendationsData] = await Promise.all([
          getItineraryById(id),
          getItineraryRecommendations(id, 0, 50),
        ]);
        // The API helpers do not support aborting requests. Ignore obsolete results.
        if (cancelled) return;
        setDestination(itineraryData?.destinationCity || "");
        const transformedAttractions = (recommendationsData?.items || []).map((place, index) => {
          const location = normalizePlaceCoordinates(place);
          return {
            ...place,
            marker_id: index + 1,
            place_id: place.id,
            latitude: location?.lat ?? null,
            longitude: location?.lng ?? null,
            location,
            categories: place.categories || [],
            itineraryPlaceId: place.itineraryPlaceRecordId,
            pinned: place.pinned || false,
          };
        });
        setAttractions(transformedAttractions);
        setInterests(transformedAttractions.filter((place) => place.pinned).map((place) => place.place_id));
        setMapCenter(calculateMapCenter(transformedAttractions));
        const placesWithCoordinates = transformedAttractions.filter((place) => place.location);
        placesWithCoordinates.forEach((place, index) => {
          addFromPlace({ ...place, geometry: { location: place.location } }, index);
        });
        fitToPlaces(placesWithCoordinates);
      } catch (error) {
        if (!cancelled) setErr(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      itineraryVersion.current += 1;
    };
  }, [id, clearMarkers, addFromPlace, fitToPlaces, setSelected]);

  const attractionClickHandler = (attraction) => {
    setSelectedAttraction(attraction);
    if (attraction.location && mapRef.current) zoomMapToPlace(attraction);
  };

  const attractionSelectedHandler = async (attraction) => {
    const placeId = attraction.place_id;
    if (!placeId || pendingInterests.current.has(placeId)) return;
    const request = Symbol(placeId);
    const version = itineraryVersion.current;
    const previouslySelected = interests.includes(placeId) || !!attraction.pinned;
    const pinned = !previouslySelected;
    pendingInterests.current.set(placeId, request);
    setUpdatingInterests((count) => count + 1);
    setInterests((current) => pinned ? [...new Set([...current, placeId])] : current.filter((value) => value !== placeId));
    setAttractions((current) => current.map((place) => place.place_id === placeId ? { ...place, pinned } : place));

    try {
      await updateInterest(id, placeId, pinned);
    } catch (error) {
      if (version !== itineraryVersion.current) return;
      // Revert this place only; other places may have been successfully updated meanwhile.
      setInterests((current) => previouslySelected
        ? [...new Set([...current, placeId])]
        : current.filter((value) => value !== placeId));
      setAttractions((current) => current.map((place) => place.place_id === placeId
        ? { ...place, pinned: previouslySelected } : place));
      alert('Failed to update interest. Please try again.');
    } finally {
      if (pendingInterests.current.get(placeId) === request) pendingInterests.current.delete(placeId);
      if (version === itineraryVersion.current) setUpdatingInterests((count) => count - 1);
    }
  };

  const togglePlanDisplay = async () => {
    if (pendingInterests.current.size || loading) return;
    const version = itineraryVersion.current;
    if (!displayPlan) {
      try {
        setLoading(true);
        setErr(null);
        const planRequest = {
          travelMode: "DRIVING",
          dailyStart: "09:00",
          dailyEnd: "20:00",
          avoidCrowds: false,
          minimizeTransfers: false,
          balanceCategories: true,
        };
        const planData = await planItinerary(id, planRequest);
        if (version !== itineraryVersion.current) return;
        setPlan(planData);
      } catch (error) {
        if (version === itineraryVersion.current) setErr(error);
        return;
      } finally {
        if (version === itineraryVersion.current) setLoading(false);
      }
    }
    if (version === itineraryVersion.current) setDisplayPlan((previous) => !previous);
  };

  return (
    <PageContainer maxWidth={false}>
      <Box
        sx={{ display: "flex", overflow: "hidden" }}
        height={{ xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, px: 4 }}>
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              mb: 2,
              alignItems: "center",
              borderBottom: "1px solid #333",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Recommendations({attractions.length})
            </Typography>
            <Typography sx={{ ml: 4 }} variant="h6" fontWeight="bold">
              Places to visit ({interests.length})
            </Typography>
            <Button
              size="small"
              sx={{ marginLeft: "auto", mb: 1 }}
              variant="outlined"
              onClick={togglePlanDisplay}
              disabled={loading || updatingInterests > 0}
            >
              {displayPlan ? "Back" : "Generate Plan"}
            </Button>
          </Box>
          <Box
            sx={{
              pb: 10,
              flex: 1,
              overflow: "scroll",
              "&::-webkit-scrollbar": {
                display: "none", // Chrome / Safari
              },
            }}
          >
            {err && (
              <Box sx={{ mb: 2, p: 2, bgcolor: "error.light", borderRadius: 1 }}>
                <Typography color="error" variant="body2">
                  Error: {err.message || 'Failed to load data'}
                </Typography>
              </Box>
            )}
            {!displayPlan && (
              <AttractionsList
                attractions={attractions}
                selected={interests}
                loading={loading}
                onClick={attractionClickHandler}
                onSelected={attractionSelectedHandler}
              />
            )}
            {displayPlan && plan && <ItineraryTimeline response={plan} />}
            {displayPlan && !plan && loading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Generating your personalized itinerary...</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          style={{
            width: "60%",
            transition: "width 280ms ease-in-out",
            flexShrink: 0,
          }}
        >
          <MapCanvas
            center={mapCenter}
            onLoad={onMapLoad}
            height={{ xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" }}
          >
            {markers.map((m) => (
              <PlaceMarker
                key={m.id}
                onSelect={() => setSelected(m.place)}
                position={m.position}
                place={m.place}
                iconUrl={
                  interests.includes(m?.place?.place_id)
                    ? redMarkerIcon
                    : m.place?.marker_id === selectedAttraction?.marker_id
                    ? blueMarkerIcon
                    : markerIcon
                }
                size={32}
                labelText={m.place?.marker_id}
                isSelectedAttraction={
                  m.place?.marker_id === selectedAttraction?.marker_id
                }
              />
            ))}

            {selected && (
              <MapPlacePopup
                selected={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </MapCanvas>
        </Box>
      </Box>
    </PageContainer>
  );
}
