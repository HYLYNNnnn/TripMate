import { useState, useEffect } from 'react';
import { Card, CardMedia, CardActionArea, CardContent, Typography, Box, Chip } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getItineraryFirstPlaceImage, getItineraryImage } from '../../api';
import usePlacePhoto from '../../hooks/usePlacePhoto';
import fallbackPhoto from '../../assets/bg.png';

export default function PlanCardWithPhoto({ itinerary }) {
  const [firstPlace, setFirstPlace] = useState(null);
  const [fallbackImageUrl, setFallbackImageUrl] = useState(null);
  const navigate = useNavigate();

  // Get the first place data for photo fetching
  useEffect(() => {
    let active = true;
    setFirstPlace(null);
    setFallbackImageUrl(null);
    Promise.all([getItineraryFirstPlaceImage(itinerary.id), getItineraryImage(itinerary.id)])
      .then(([place, image]) => {
        if (active) {
          setFirstPlace(place);
          setFallbackImageUrl(image);
        }
      })
      .catch(() => {
        // Missing optional photos should keep the bundled fallback image.
      });
    return () => { active = false; };
  }, [itinerary.id]);

  // Use the place photo hook to fetch real images
  const { photoUrl } = usePlacePhoto(firstPlace);

  const handleCardClick = () => {
    navigate(`/plan/${itinerary.id}`);
  };

  const formatTravelMode = (travelMode) => {
    if (!travelMode) return null;
    return travelMode.toLowerCase().replace('_', ' ');
  };

  const formatTravelPace = (travelPace) => {
    if (!travelPace) return null;
    return travelPace.toLowerCase().replace('_', ' ');
  };

  const getTravelPaceColor = (travelPace) => {
    switch (travelPace?.toUpperCase()) {
      case 'RELAXED':
        return 'success';
      case 'MODERATE':
        return 'primary';
      case 'PACKED':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options = { month: 'short', day: 'numeric' };
    
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  };

  // Determine which image to use
  const getImageUrl = () => {
    if (photoUrl) {
      return photoUrl; // Google Places photo (highest priority)
    }
    if (fallbackImageUrl) {
      return fallbackImageUrl; // Backend provided image
    }
    // Default fallback image
    return fallbackPhoto;
  };

  return (
    <Card
      sx={{ 
        width: '100%', 
        minWidth: 0, 
        maxWidth: 400, 
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardActionArea onClick={handleCardClick}>
        <CardMedia
          component="img"
          sx={{ height: 200, objectFit: 'cover' }}
          image={getImageUrl()}
          alt={itinerary.destinationCity}
        />
        
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <PlaceIcon fontSize="small" color="primary" />
            <Typography variant="h6" fontWeight="bold" noWrap>
              {itinerary.destinationCity}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDateRange(itinerary.startDate, itinerary.endDate)}
            </Typography>
          </Box>
          
          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
            {itinerary.travelMode && (
              <Chip 
                label={formatTravelMode(itinerary.travelMode)} 
                size="small" 
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            )}
            {itinerary.travelPace && (
              <Chip 
                label={formatTravelPace(itinerary.travelPace)} 
                size="small" 
                variant="outlined"
                color={getTravelPaceColor(itinerary.travelPace)}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}