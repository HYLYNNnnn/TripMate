package org.laioffer.planner.itinerary;

import org.junit.jupiter.api.Test;
import org.laioffer.planner.entity.ItineraryEntity;
import org.laioffer.planner.entity.UserEntity;
import org.laioffer.planner.user.model.UserRole;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ItineraryControllerTest {
    @Test void creationReturnsAcceptedAndTheIdNeededByTheFrontend() throws Exception {
        var service = mock(ItineraryService.class);
        var saved = new ItineraryEntity();
        UUID id = UUID.randomUUID();
        saved.setId(id);
        saved.setDestinationCity("San Francisco");
        when(service.createItinerary(any(), any())).thenReturn(saved);
        var mvc = MockMvcBuilders.standaloneSetup(new ItineraryController(service))
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();
        var user = new UserEntity(UserRole.USER, "unit@example.test", "unit", "unused");
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, null, List.of()));
        try {
            mvc.perform(post("/api/itineraries").contentType(MediaType.APPLICATION_JSON)
                .content("{\"destinationCity\":\"San Francisco\",\"startDate\":\"2027-03-01T00:00:00Z\",\"endDate\":\"2027-03-03T00:00:00Z\"}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.itineraryId").value(id.toString()));
            verify(service).createItinerary(any(), eq(user));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
