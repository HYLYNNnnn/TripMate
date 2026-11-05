import { useState, useEffect, useRef } from "react";
import useDebounced from './useDebounced';
import usePlacesClient from './usePlacesClient';
import { buildAutocompleteRequest, filterAutocompletePredictions } from '../utils/places';
export default function usePlacesPredictions({
  minLength = 2,
  debounceMs = 250,
  includedPrimaryTypes,
  excludedPrimaryTypes,
  includedRegionCodes,
  locationBias,
  locationRestriction,
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const { service, ready } = usePlacesClient();
  const requestVersion = useRef(0);
  const constraintsKey = JSON.stringify({
    includedPrimaryTypes, excludedPrimaryTypes, includedRegionCodes, locationBias, locationRestriction, minLength,
  });

  const requestPredictions = useDebounced((text, version) => {
    const constraints = { includedPrimaryTypes, excludedPrimaryTypes, includedRegionCodes, locationBias, locationRestriction };
    try {
      const request = buildAutocompleteRequest(text, constraints);
      service.getPlacePredictions(request, (predictions) => {
        if (version === requestVersion.current) {
          setOptions(filterAutocompletePredictions(predictions, constraints));
        }
      });
    } catch (error) {
      if (version === requestVersion.current) setOptions([]);
    }
  }, debounceMs);

  useEffect(() => {
    const version = ++requestVersion.current;
    if (ready && service && input.trim().length >= minLength) {
      requestPredictions(input, version);
    } else {
      setOptions([]);
    }
    return () => {
      requestVersion.current += 1;
      requestPredictions.cancel();
    };
  }, [input, requestPredictions, ready, service, minLength, constraintsKey]);
  return { input, setInput, options, ready };
}
