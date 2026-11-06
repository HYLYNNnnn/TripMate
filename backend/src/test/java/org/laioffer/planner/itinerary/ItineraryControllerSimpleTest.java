package org.laioffer.planner.itinerary;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.laioffer.planner.model.itinerary.CreateItineraryRequest;
import org.laioffer.planner.model.itinerary.TravelMode;
import org.laioffer.planner.model.common.TravelPace;
import org.laioffer.planner.entity.ItineraryEntity;
import org.laioffer.planner.repository.ItineraryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@org.springframework.test.context.ActiveProfiles({"demo", "test"})
class ItineraryControllerSimpleTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public LangChain4jLLMService mockLLMService() {
            return mock(LangChain4jLLMService.class);
        }
        
        @Bean
        @Primary
        public POIService mockPOIService() {
            return mock(POIService.class);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ItineraryRepository itineraryRepository;
    @Autowired private org.laioffer.planner.repository.UserRepository userRepository;

    /**
     * This test demonstrates how to simulate Postman operations in Spring Boot:
     * 1. Send a POST request with JSON body (like Postman)
     * 2. Verify HTTP response status
     * 3. Check that data was stored in the database
     */
    @Test
    void testCreateItinerary_PostRequestLikePostman() throws Exception {
        // Given - Create request body JSON (like in Postman)
        CreateItineraryRequest request = new CreateItineraryRequest();
        request.setDestinationCity("San Francisco");
        request.setStartDate(OffsetDateTime.parse("2024-03-01T10:00:00-08:00"));
        request.setEndDate(OffsetDateTime.parse("2024-03-05T18:00:00-08:00"));
        request.setTravelMode(TravelMode.DRIVING);
        request.setBudgetLimitCents(500000);
        request.setTravelPace(TravelPace.MODERATE);

        // Convert to JSON string (like request body in Postman)
        String requestJson = objectMapper.writeValueAsString(request);
        var user = userRepository.save(new org.laioffer.planner.entity.UserEntity(
            org.laioffer.planner.user.model.UserRole.USER, "simple@example.test", "simple", "unused-test-password"));

        // When - Send POST request (simulating Postman)
        mockMvc.perform(post("/api/itineraries")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
                .andExpect(status().isAccepted());

        // Then - Verify database storage (verify the DTO was saved)
        List<ItineraryEntity> savedItineraries = itineraryRepository.findAll();
        assertThat(savedItineraries).hasSize(1);

        ItineraryEntity savedItinerary = savedItineraries.get(0);

        // Verify all the DTO fields were properly mapped to the entity
        assertThat(savedItinerary.getId()).isNotNull();
        assertThat(savedItinerary.getDestinationCity()).isEqualTo("San Francisco");
        assertThat(savedItinerary.getStartDate()).isEqualTo(request.getStartDate());
        assertThat(savedItinerary.getEndDate()).isEqualTo(request.getEndDate());
        assertThat(savedItinerary.getTravelMode()).isEqualTo(TravelMode.DRIVING);
        assertThat(savedItinerary.getBudgetInCents()).isEqualTo(500000);
        assertThat(savedItinerary.getTravelPace()).isEqualTo(TravelPace.MODERATE);

        // Verify timestamps were automatically populated
        assertThat(savedItinerary.getCreatedAt()).isNotNull();
        assertThat(savedItinerary.getUpdatedAt()).isNotNull();

        // Verify AI metadata was calculated and stored
        assertThat(savedItinerary.getAiMetadata()).isNotNull();
        assertThat(savedItinerary.getAiMetadata().get("staying_days")).isEqualTo(5);
        assertThat(savedItinerary.getAiMetadata().get("recommended_poi_count")).isEqualTo(16);
        
        System.out.println("✓ Test successfully simulated Postman POST request");
        System.out.println("✓ Request JSON: " + requestJson);
        System.out.println("✓ Response: 202 Accepted");
        System.out.println("✓ Database entity created with ID: " + savedItinerary.getId());
    }
}
