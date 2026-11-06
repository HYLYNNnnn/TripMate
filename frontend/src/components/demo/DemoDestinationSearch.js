import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";

export default function DemoDestinationSearch({ onSelect, onClear, sx, size = "small", placeholder = "Choose a demo destination" }) {
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const base = (process.env.REACT_APP_API_BASE || "/api").replace(/\/+$/, "");
    fetch(`${base}/demo/destinations`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw Error(); return response.json(); })
      .then(setOptions).catch(error => { if (error.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, []);
  return <Autocomplete options={options} getOptionLabel={option => option.name}
    isOptionEqualToValue={(a, b) => a.place_id === b.place_id}
    onChange={(_, option) => option ? onSelect?.(option) : onClear?.()}
    renderInput={params => <TextField {...params} size={size} placeholder={placeholder}
      error={error} helperText={error ? "The demo service is unavailable. Please refresh to retry." : "Sample destination: San Francisco"} />}
    sx={{ width: { xs: "100%", sm: 360 }, ...sx }} />;
}
