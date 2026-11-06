# Trip Mate frontend

React 19 frontend using Material UI 7, React Router 7, Axios and Google Maps. The root repository now also includes an adapted team backend; see the [root README](../README.md) for the complete local demo.

## Development

```sh
npm ci
cp .env.local.example .env.local
npm start
```

Set `REACT_APP_API_BASE` to the team API base (default `/api`) and supply `REACT_APP_MAPS_BROWSER_KEY` for map features. The example also lists Firebase variables for the Firebase module included in the source; the current authentication context uses JWT-based API authentication.

The development proxy targets `http://localhost:8080`. JWT tokens returned by the authentication service are stored in localStorage and attached by the API client. Backend access and map configuration are required to verify connected features.

## Tests and build

```sh
npm test -- --watchAll=false --runInBand
```

Tests mock the backend and Google services; no real credentials are required. `REACT_APP_USE_MOCK_DATA=false` keeps normal API errors visible. Only an explicit `true` permits development fixture fallbacks for selected queries, and authentication/permission failures still reject.


```sh
npm run build
```

The output is generated in `build/`. For deployment, configure API routing and a fallback to `index.html` for React Router page URLs.

## Included areas

- Authentication UI and React Context state.
- Destination search, trip preferences and date selection.
- Maps, markers, place details and photos through custom hooks.
- Recommendation lists, pinned interests and itinerary planning requests.
- A centralized API layer, an OpenAPI snapshot and development mock fixtures.

Set `REACT_APP_DEMO_MODE=true` together with the backend's `demo` profile for sample destination search and Leaflet/OpenStreetMap, without a Google key. Keep `REACT_APP_USE_MOCK_DATA=false`: the complete demo uses real local API requests rather than substituting successful frontend fixtures for failed requests.

The setup countdown controls navigation. The detail page polls the backend's `generation_pending` metadata until recommendations are ready; previously saved plans can be reopened without generating them again. Known review findings and integration results are recorded in [前端检查说明](../前端检查说明.zh-CN.md).
