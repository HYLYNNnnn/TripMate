package org.laioffer.planner.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.laioffer.planner.model.common.GeoPoint;
import org.laioffer.planner.model.place.PlaceDTO;
import org.laioffer.planner.planning.ai.model.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Deterministic fixtures for the explicit demo profile; no external AI requests. */
@Service
public class DemoTravelService {
    private final JsonNode attractions;
    public DemoTravelService(ObjectMapper mapper) throws IOException {
        try (var stream = new ClassPathResource("demo-attractions.json").getInputStream()) {
            attractions = mapper.readTree(stream).path("data");
        }
    }

    public List<PlaceDTO> recommendations(String city, int limit) {
        if (!city.toLowerCase(Locale.ROOT).startsWith("san francisco")) {
            throw new IllegalArgumentException("The demo currently includes San Francisco. Please choose that destination.");
        }
        List<PlaceDTO> places = new ArrayList<>();
        for (JsonNode source : attractions) {
            if (places.size() >= limit) break;
            var point = source.path("location");
            PlaceDTO place = new PlaceDTO(UUID.randomUUID(), source.path("name").asText(),
                new GeoPoint(point.path("lat").asDouble(), point.path("lng").asDouble()),
                source.path("formatted_address").asText());
            place.setDescription("Sample attraction from the TripMate demonstration catalog.");
            places.add(place);
        }
        return places;
    }

    public AiPlanResponse plan(LocalDate start, LocalDate end, LocalTime dailyStart, LocalTime dailyEnd,
                                List<AiPlaceInfo> places) {
        if (!dailyStart.isBefore(dailyEnd)) throw new IllegalArgumentException("Daily end time must be after the start time.");
        long dayCount = ChronoUnit.DAYS.between(start, end) + 1;
        if (dayCount < 1 || dayCount > 30) throw new IllegalArgumentException("Please choose a trip of 1 to 30 days.");
        int dailyLimit = (int) ((ChronoUnit.MINUTES.between(dailyStart, dailyEnd) + 30) / 90);
        if (dailyLimit < 1 || places.size() > dayCount * dailyLimit) {
            throw new IllegalArgumentException("Choose fewer places or more travel days to fit the daily schedule.");
        }
        int perDay = Math.min(dailyLimit, (int) Math.ceil(places.size() / (double) dayCount));
        List<AiPlannedDay> days = new ArrayList<>();
        int cursor = 0;
        for (int day = 0; day < dayCount; day++) {
            AiPlannedDay plannedDay = new AiPlannedDay();
            plannedDay.setDate(start.plusDays(day));
            List<AiPlannedStop> stops = new ArrayList<>();
            LocalTime arrival = dailyStart;
            for (int n = 0; n < perDay && cursor < places.size(); n++) {
                AiPlaceInfo place = places.get(cursor++);
                AiPlannedStop stop = new AiPlannedStop();
                stop.setPlaceId(place.getPlaceId());
                stop.setPlaceName(place.getName());
                stop.setArrivalTime(arrival);
                stop.setDepartureTime(arrival.plusMinutes(60));
                stop.setDurationMinutes(60);
                stop.setActivity("Explore " + place.getName() + ". Sample schedule; check real opening hours and transport before traveling.");
                stops.add(stop);
                arrival = arrival.plusMinutes(90);
            }
            plannedDay.setStops(stops);
            plannedDay.setSummary(stops.isEmpty() ? "Free time" : "Sample day plan");
            days.add(plannedDay);
        }
        AiPlanResponse response = new AiPlanResponse();
        response.setDays(days);
        response.setSummary("Deterministic demonstration schedule, generated without an AI provider.");
        return response;
    }
}
