import AttractionCard from "./AttractionCard";
import usePlacePhoto from "../../hooks/usePlacePhoto";
import fallbackPhoto from "../../assets/bg.png";

/**
 * AttractionCard wrapper that fetches real place photos from Google Places API
 */
export default function AttractionCardWithPhoto({ attraction, selected, onClick, onSelected }) {
  const fallbackImage = attraction.imageUrl || null;
  
  // Use the place photo hook to fetch real images
  const { photoUrl } = usePlacePhoto({
    name: attraction.name,
    address: attraction.address,
    location: attraction.location
  });

  // Determine which image to use
  const getImageUrl = () => {
    if (photoUrl) {
      return photoUrl; // Google Places photo (highest priority)
    }
    if (fallbackImage) {
      return fallbackImage; // Backend provided image
    }
    // Default fallback image
    return fallbackPhoto;
  };

  return (
    <AttractionCard
      selected={selected}
      onClick={onClick}
      onSelected={onSelected}
      image={getImageUrl()}
      title={attraction.name}
      category={attraction.categories?.join(", ") || attraction.category || ""}
      id={attraction.marker_id}
    />
  );
}