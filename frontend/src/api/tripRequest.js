const categories = {
  "Culture & History": ["CULTURE", "HISTORICAL"],
  "Nature & Adventure": ["NATURE", "ADVENTURE"],
  "Food & Drink": ["FOOD"],
  "Relaxation": ["NATURE"],
  "Shopping": ["SHOPPING"],
  "Nightlife": ["NIGHTLIFE"],
};
const budgetLabels = { 1: "Flexible budget", 2: "Budget-friendly", 3: "Moderate pricing", 4: "Upscale / Premium", 5: "Luxury experience" };

/** Translate the setup form into the supplied Spring backend's actual DTO. */
export function toItineraryRequest(form) {
  const transportation = form.preferences?.transportation || [];
  const styles = form.preferences?.travelStyle || [];
  return {
    destinationCity: form.destination,
    // Preserve the selected calendar dates; the backend requires offset timestamps.
    startDate: `${form.startDate}T00:00:00Z`,
    endDate: `${form.endDate}T00:00:00Z`,
    travelMode: transportation.includes("Rental Car") ? "DRIVING" : transportation.includes("Public Transit") ? "TRANSIT" : "WALKING",
    travelPace: styles.includes("Relaxation") ? "RELAXED" : "MODERATE",
    activityIntensity: "MODERATE",
    numberOfTravelers: (form.travelers?.adults || 0) + (form.travelers?.children || 0) + (form.travelers?.infants || 0),
    hasChildren: (form.travelers?.children || 0) + (form.travelers?.infants || 0) > 0,
    preferredCategories: [...new Set(styles.flatMap(style => categories[style] || []))],
    // Budget choices are tiers, not currency amounts. Preserve them in preferences.
    additionalPreferences: [
      `Budget preference: ${budgetLabels[form.budget] || "Flexible budget"}`,
      `Transport preferences: ${transportation.join(", ") || "No preference"}`,
      `Dietary needs: ${(form.preferences?.dietaryRestrictions || []).join(", ") || "None"}`,
      `Must-see places: ${form.preferences?.mustSeePlaces || "None"}`,
      `Pets: ${form.travelers?.pets || 0}`,
    ].join("\n"),
  };
}
