package org.laioffer.planner.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.Map;

@Controller
public class WebController {
    private final boolean demo;
    public WebController(@Value("${tripmate.demo:false}") boolean demo) { this.demo = demo; }

    @GetMapping({"/", "/setup", "/plan", "/plan/{id}", "/itinerary"})
    public String frontend() { return "forward:/index.html"; }

    @GetMapping("/api/health")
    @ResponseBody
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "TripMate", "demo", demo);
    }
}
