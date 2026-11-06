FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV REACT_APP_DEMO_MODE=true REACT_APP_API_BASE=/api
RUN npm run build

FROM gradle:8.14.3-jdk21 AS backend
WORKDIR /app/backend
COPY backend/ ./
COPY --from=frontend /app/frontend/build /app/frontend/build
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/backend/build/libs/*SNAPSHOT.jar app.jar
COPY backend/LICENSE /app/notices/TravelPlannerBackend-LICENSE
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
