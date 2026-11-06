package org.laioffer.planner.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.laioffer.planner.planning.ai.model.AiPlaceInfo;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class DemoTravelServiceTest {
    @Test void demoPlansUseEachSelectedPlaceOnceWithinTheChosenDatesAndHours() throws Exception {
        var service = new DemoTravelService(new ObjectMapper());
        var places = service.recommendations("San Francisco", 5).stream().map(place -> {
            var input = new AiPlaceInfo(); input.setPlaceId(place.getId()); input.setName(place.getName()); return input;
        }).toList();
        LocalDate first = LocalDate.of(2027, 3, 10);
        var plan = service.plan(first, first.plusDays(1), LocalTime.of(9, 0), LocalTime.of(20, 0), places);
        var stops = plan.getDays().stream().flatMap(day -> day.getStops().stream()).toList();
        assertThat(plan.getDays()).hasSize(2);
        assertThat(stops).extracting(stop -> stop.getPlaceId()).containsExactlyElementsOf(places.stream().map(AiPlaceInfo::getPlaceId).toList());
        assertThat(stops).allMatch(stop -> !stop.getArrivalTime().isBefore(LocalTime.of(9, 0)) && !stop.getDepartureTime().isAfter(LocalTime.of(20, 0)));
    }
    @Test void unsupportedDemoDestinationsAndOverfullDaysFailExplicitly() throws Exception {
        var service = new DemoTravelService(new ObjectMapper());
        assertThatThrownBy(() -> service.recommendations("Tokyo", 5)).isInstanceOf(IllegalArgumentException.class);
        var input = new AiPlaceInfo(); input.setPlaceId(UUID.randomUUID());
        assertThatThrownBy(() -> service.plan(LocalDate.now(), LocalDate.now(), LocalTime.of(9, 0), LocalTime.of(9, 30), List.of(input)))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
