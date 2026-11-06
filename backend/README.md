# TripMate backend

Adapted from TravelPlannerBackend. The original MIT license is preserved in [LICENSE](LICENSE).

Use JDK 21 and PostgreSQL. The root `scripts/run-demo.sh` builds the React frontend and starts this service with the `demo` profile. Database settings use `DATABASE_URL` (host), `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`.

`SPRING_PROFILES_ACTIVE=demo ./gradlew bootRun` enables fixed sample recommendations and deterministic scheduling without external AI calls. JWT authentication, ownership checks, trips, pinned interests and saved plans still use the real backend and database. The browser demo build uses `REACT_APP_DEMO_MODE=true` with Leaflet/OpenStreetMap; tiles require internet access.

For the original live AI path, unset the demo profile and configure `OPENAI_API_KEY`, `OPENAI_MODEL` and a base64-encoded `JWT_SECRET_KEY` with at least 32 decoded bytes. Build the frontend with `REACT_APP_DEMO_MODE=false` and `REACT_APP_MAPS_BROWSER_KEY` for Google Maps / Places. Keep backend credentials out of frontend variables. The live provider path is retained but has not been exercised in the local demo checks.

The React build from `../frontend/build` is bundled when Gradle processes resources. The service exposes `/api/health` and serves frontend routes and `/api/*` from one origin.

Run `./gradlew test` for the H2-backed controller/persistence checks and deterministic scheduler tests. These tests use isolated data and do not call external APIs. Full local HTTP checks additionally use PostgreSQL.
