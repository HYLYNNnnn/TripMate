# Trip Mate — Frontend

The React frontend for a collaborative AI travel planning project. This repository covers the frontend work completed with teammates: UI, Google Maps integration, authentication state and REST API integration.

The backend implementation is outside this repository's scope. A separate backend source folder is not required for this frontend contribution.

## Source layout

- `frontend/src/`: React pages, components, custom hooks, authentication and API services.
- `frontend/public/mock/`: development fixtures.
- `frontend/openapi.yaml`: the API contract snapshot supplied with the project.
- `frontend/.env.local.example`: configuration variable names with no real credentials.

## Local setup

From `frontend/`, install dependencies with `npm ci`, copy `.env.local.example` to `.env.local`, and configure the team's API base and Google Maps browser key. Then run `npm start`.

The default API base is `/api`; the CRA development proxy targets `http://localhost:8080`. Supply `REACT_APP_API_BASE` when using a different backend. Configure hosting to route frontend pages and API requests appropriately in production.

Run `npm test -- --watchAll=false --runInBand` for mocked frontend regression tests, and `npm run build` for a production bundle. Real environment files, dependency folders and generated builds remain ignored.

## Development fixtures

`REACT_APP_USE_MOCK_DATA=false` is the default. Enable it explicitly only when allowing development fixture fallbacks for selected itinerary queries. Authentication and permission errors are never replaced by mock success data.

## Review status

The frontend source is present. Its scope is distinct from a full-stack repository. Focused frontend fixes and regression tests are included; see [前端检查说明](前端检查说明.zh-CN.md) for concrete findings and verification results. This review does not claim that a live team backend or Google Maps account has been tested.

## Verification

On 2026-11-04, all 43 mocked frontend regression tests passed across 8 suites. Date tests also passed in both Los Angeles and Shanghai time zones. The production build succeeded with `CI=true` and no code lint warnings. Dependency metadata notices remain; no dependencies were upgraded. A live team backend and Google Maps account were not contacted.
