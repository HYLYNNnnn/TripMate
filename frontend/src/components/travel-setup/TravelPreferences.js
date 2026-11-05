import { Box, Typography, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { travelStyles, transportationOptions } from './travelSetupOptions'
import SmallButton from "../SmallButton";

const TravelPreferences = ({ onPrev, onNext, onChange, preferences }) => {
  const handleCheckboxChange = (category, option) => {
    onChange(prev => {
      const newPrefs = { ...prev };

      if (newPrefs[category].some((o) => o.id === option.id)) {
        newPrefs[category] = newPrefs[category].filter(item => item.id !== option.id);
      } else {
        newPrefs[category] = [...newPrefs[category], option];
      }

      return newPrefs;
    });
  };

  const renderCheckboxGroup = (title, options, category) => (
    <>
      <Typography variant="body1" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {title}
      </Typography>
      <FormGroup row sx={{ flexWrap: 'wrap' }}>
        {options.map((option) => (
          <Box key={option.id} sx={{ width: '45%' }}>
            <FormControlLabel
              key={option.id}
              control={
                <Checkbox
                  size="small"
                  checked={preferences[category].some((o) => o.id === option.id)}
                  onChange={() => handleCheckboxChange(category, option)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Box>
              }
            />
          </Box>
        ))}
      </FormGroup>
    </>
  );

  return (
    <Box sx={{ mx: 'auto' }}>
      {renderCheckboxGroup(
        "What's your travel style?",
        travelStyles,
        "travelStyle"
      )}

      {renderCheckboxGroup(
        "How do you prefer to get around?",
        transportationOptions,
        "transportation"
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <SmallButton variant="outlined" onClick={onPrev}>
          Prev
        </SmallButton>
        <SmallButton variant="outlined" onClick={onNext}>
          Next
        </SmallButton>
      </Box>
    </Box>
  );
};

export default TravelPreferences;