import { Alert, Typography, Grid } from '@mui/material';
import { budgetOptions } from './travelSetupOptions';

// format date
const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function TravelSummary({
  travelers = 1,
  startDate,
  endDate,
  duration,
  budget = 'Any',
  preferences = {},
  mustSee,
  dietaryRestrictions
}) {
  const startDateFormatted = formatDate(startDate);
  const endDateFormatted = formatDate(endDate);
  return <Alert
    severity="success"
    icon={false}
    sx={{ mb: 3 }}
  >
    <Typography variant="h5" sx={{ mb: 2 }}>
      ✈️ Trip Summary
    </Typography>

    <Grid container spacing={2}>
      <Grid item size={12} container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            Start
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" fontWeight="bold">
            {startDateFormatted || '-/-/-'}
          </Typography>
        </Grid>
      </Grid>
      <Grid item size={12} container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            End
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" fontWeight="bold">
            {endDateFormatted || '-/-/-'}
          </Typography>
        </Grid>
      </Grid>
      <Grid item size={12} container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            Duration
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" fontWeight="bold">
            {duration ? duration === 1 ? `${duration} day` : `${duration} days` : '-'}
          </Typography>
        </Grid>
      </Grid>
      <Grid item size={12} container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            Travelers
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" fontWeight="bold">
            {travelers}
          </Typography>
        </Grid>
      </Grid>
      <Grid item size={12} container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2" color="text.secondary">
            Budget
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" fontWeight="bold">
            {budgetOptions.find(({ id }) => id === budget)?.label || ''}
          </Typography>
        </Grid>
      </Grid>
      <Grid item size={12}>
        <Typography variant="body2" color="text.secondary">
          Travel Style
        </Typography>
        <Typography variant="body2">
          {preferences.travelStyle && preferences.travelStyle.length > 0 ? preferences.travelStyle.map(style => style.label).join(', ') : ' - '}
        </Typography>
      </Grid>
      <Grid item size={12}>
        <Typography variant="body2" color="text.secondary">
          Transportation
        </Typography>
        <Typography variant="body2">
          {preferences.transportation && preferences.transportation.length > 0 ? preferences.transportation.map(i => i.label).join(', ') : ' - '}
        </Typography>
      </Grid>
      <Grid item size={12}>
        <Typography variant="body2" color="text.secondary">
          Dietary Needs
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {dietaryRestrictions && dietaryRestrictions.length > 0 ? dietaryRestrictions.map(i => i.label).join(', ') : ' - '}
        </Typography>
      </Grid>
      <Grid item size={12}>
        <Typography variant="body2" color="text.secondary">
          Must-see
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {mustSee || '-'}
        </Typography>
      </Grid>
    </Grid>
  </Alert>

}
export default TravelSummary;