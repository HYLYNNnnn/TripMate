import { Grid, Box, Typography, CircularProgress } from "@mui/material";
import PlanCardWithPhoto from "./PlanCardWithPhoto";

export default function PlansList({ itineraries, loading, error }) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error" variant="body1">
          Failed to load itineraries. Please try again.
        </Typography>
      </Box>
    );
  }

  if (!itineraries || itineraries.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="body1" color="text.secondary">
          No itineraries found. Create your first trip plan!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {itineraries.map((itinerary) => (
        <Grid 
          size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}
          key={itinerary.id}
        >
          <PlanCardWithPhoto itinerary={itinerary} />
        </Grid>
      ))}
    </Grid>
  );
}
