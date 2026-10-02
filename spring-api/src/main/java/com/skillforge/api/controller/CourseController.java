package com.skillforge.api.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.api.model.Course;
import com.skillforge.api.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CourseController — REST endpoints for SkillForge course data.
 *
 * DATA SOURCE STRATEGY (Week 8 Day 2):
 *   Primary:  MongoDB Atlas via CourseRepository (when available)
 *   Fallback: courses.json filesystem (when MongoDB TLS fails on Windows JVM)
 *
 * The DataSeeder imports courses.json into MongoDB on first run.
 * CourseController tries MongoDB first; if unavailable, falls back
 * to the JSON file so the frontend always has data.
 *
 * NOTE: Spring Boot's Java TLS stack has a known incompatibility
 * with MongoDB Atlas on certain Windows environments. Node.js
 * bypasses this by using its bundled OpenSSL. The fallback ensures
 * the service remains functional for the college demo.
 *
 * Week 8 Day 2
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501"
})
public class CourseController {

    private final CourseRepository courseRepository;
    private final ObjectMapper     objectMapper = new ObjectMapper();

    // JSON fallback cache — populated if MongoDB is unavailable
    private List<Course> jsonFallback = new ArrayList<>();
    private boolean      mongoAvailable = false;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @PostConstruct
    public void init() {
        // Try MongoDB first
        try {
            long count = courseRepository.count();
            mongoAvailable = true;
            System.out.printf("[startup] MongoDB available — %d courses%n", count);
        } catch (Exception e) {
            System.err.println("[startup] MongoDB unavailable — falling back to courses.json: " + e.getMessage().split("\\n")[0]);
            mongoAvailable = false;
            loadJsonFallback();
        }
    }

    private void loadJsonFallback() {
        List<Path> candidates = List.of(
                Paths.get("../data/courses.json"),
                Paths.get("data/courses.json"),
                Paths.get("courses.json")
        );
        for (Path p : candidates) {
            if (Files.exists(p)) {
                try {
                    jsonFallback = objectMapper.readValue(p.toFile(), new TypeReference<>() {});
                    System.out.printf("[startup] JSON fallback: loaded %d courses from %s%n", jsonFallback.size(), p.toAbsolutePath());
                    return;
                } catch (Exception e) {
                    System.err.println("[startup] Failed to parse " + p + ": " + e.getMessage());
                }
            }
        }
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("courses.json")) {
            if (is != null) {
                jsonFallback = objectMapper.readValue(is, new TypeReference<>() {});
                System.out.printf("[startup] JSON fallback: loaded %d courses from classpath%n", jsonFallback.size());
            }
        } catch (Exception e) {
            System.err.println("[startup] All fallback paths failed: " + e.getMessage());
        }
    }

    private List<Course> getAllCourses() {
        if (mongoAvailable) {
            try { return courseRepository.findAll(); }
            catch (Exception e) { mongoAvailable = false; loadJsonFallback(); }
        }
        return new ArrayList<>(jsonFallback);
    }


    /* ── GET /api/health ─────────────────────────────────────── */

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("status",     "ok");
        r.put("service",    "skillforge-spring-api");
        r.put("courses",    mongoAvailable ? courseRepository.count() : jsonFallback.size());
        r.put("dataSource", mongoAvailable ? "mongodb" : "json-fallback");
        r.put("timestamp",  new Date().toInstant().toString());
        return r;
    }


    /* ── GET /api/courses ────────────────────────────────────── */

    @GetMapping("/courses")
    public Map<String, Object> getCourses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q
    ) {
        List<Course> result;

        if (mongoAvailable && q != null && !q.isBlank()) {
            try { result = courseRepository.searchCourses(q.trim()); }
            catch (Exception e) { result = getAllCourses(); }
        } else if (mongoAvailable && category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            try { result = courseRepository.findByCategoryIgnoreCase(category); }
            catch (Exception e) { result = getAllCourses(); }
        } else {
            result = getAllCourses();
        }

        // Client-side filter for JSON fallback
        if (!mongoAvailable) {
            if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
                final String cat = category.toLowerCase();
                result = result.stream().filter(c -> cat.equalsIgnoreCase(c.getCategory())).collect(Collectors.toList());
            }
            if (q != null && !q.isBlank()) {
                String term = q.toLowerCase().trim();
                result = result.stream().filter(c ->
                    (c.getTitle()         != null && c.getTitle().toLowerCase().contains(term)) ||
                    (c.getInstructor()    != null && c.getInstructor().toLowerCase().contains(term)) ||
                    (c.getCategoryLabel() != null && c.getCategoryLabel().toLowerCase().contains(term))
                ).collect(Collectors.toList());
            }
        }

        long total = mongoAvailable ? courseRepository.count() : jsonFallback.size();
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("count",   result.size());
        resp.put("total",   total);
        resp.put("courses", result);
        return resp;
    }


    /* ── GET /api/courses/{id} ───────────────────────────────── */

    @GetMapping("/courses/{id}")
    public ResponseEntity<Object> getCourseById(@PathVariable String id) {
        if (!id.matches("^[a-z0-9\\-]{1,80}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid course ID format", "id", id));
        }

        if (mongoAvailable) {
            try {
                return courseRepository.findById(id)
                    .map(c -> ResponseEntity.ok((Object) c))
                    .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Course not found", "id", id)));
            } catch (Exception e) { mongoAvailable = false; loadJsonFallback(); }
        }

        return jsonFallback.stream()
            .filter(c -> id.equals(c.getId()))
            .findFirst()
            .map(c -> ResponseEntity.ok((Object) c))
            .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Course not found", "id", id)));
    }
}
