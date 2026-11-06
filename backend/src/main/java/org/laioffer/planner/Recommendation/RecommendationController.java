package org.laioffer.planner.Recommendation;

import org.laioffer.planner.model.itinerary.GetRecommendationsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/itineraries")
public class RecommendationController {
    
    private final RecommendationService recommendationService;
    private final org.laioffer.planner.itinerary.ItineraryService itineraryService;
    
    @Autowired
    public RecommendationController(RecommendationService recommendationService,
                                    org.laioffer.planner.itinerary.ItineraryService itineraryService) {
        this.recommendationService = recommendationService;
        this.itineraryService = itineraryService;
    }
    
    /**
     * Get recommended places for an itinerary
     * 
     * @param itineraryId UUID of the itinerary
     * @param query Optional keyword to search for in place names/descriptions
     * @param page Page number (0-based), default 0
     * @param size Page size (1-200), default 20
     * @return Paginated list of recommended places
     */
    @GetMapping("/{itineraryId}/recommendations")
    public ResponseEntity<GetRecommendationsResponse> getRecommendations(
            @PathVariable UUID itineraryId,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.laioffer.planner.entity.UserEntity user) {
        requireOwner(itineraryId, user);
        
        try {
            GetRecommendationsResponse response = recommendationService.getRecommendations(
                    itineraryId, query, page, size);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            // Return 400 Bad Request for invalid parameters
            return ResponseEntity.badRequest().build();
            
        } catch (Exception e) {
            // Log error and return 500 Internal Server Error
            // In production, you'd want proper error logging here
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get recommendation statistics for an itinerary
     * This is an additional endpoint that could be useful for UI purposes
     * 
     * @param itineraryId UUID of the itinerary
     * @return Statistics about recommendations
     */
    @GetMapping("/{itineraryId}/recommendations/stats")
    public ResponseEntity<RecommendationService.RecommendationStats> getRecommendationStats(
            @PathVariable UUID itineraryId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.laioffer.planner.entity.UserEntity user) {
        requireOwner(itineraryId, user);
        
        try {
            RecommendationService.RecommendationStats stats = 
                    recommendationService.getRecommendationStats(itineraryId);
            
            return ResponseEntity.ok(stats);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    private void requireOwner(UUID id, org.laioffer.planner.entity.UserEntity user) {
        if (user == null || !itineraryService.isItineraryOwnedByUser(id, user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
    }
}
