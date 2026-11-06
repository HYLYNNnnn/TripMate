package org.laioffer.planner.demo;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@Profile("demo")
@RestController
public class DemoController {
    @GetMapping("/api/demo/destinations")
    public List<?> destinations() {
        return List.of(Map.of("name", "San Francisco", "place_id", "demo-san-francisco",
            "formatted_address", "San Francisco, California, United States",
            "location", Map.of("lat", 37.7749, "lng", -122.4194)));
    }
}
