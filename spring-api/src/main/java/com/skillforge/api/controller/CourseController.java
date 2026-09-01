package com.skillforge.api.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.api.model.Course;
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
 * ENDPOINTS:
 *   GET /api/courses          → all courses (optional ?category= ?q=)
 *   GET /api/courses/{id}     → single course by slug ID
 *   GET /api/health           → liveness check
 *
 * DATA SOURCE:
 *   Reads from data/courses.json — the same file used by the
 *   Node.js server — keeping a single source of truth.
 *
 *   Resolution order (first match wins):
 *   1. ../data/courses.json  relative to spring-api/ working dir
 *   2. data/courses.json     if started from project root
 *   3. courses.json on the classpath (fallback for packaged jar)
 *
 * CACHING:
 *   courses.json is read once at startup (@PostConstruct) and
 *   cached in memory. Fast for reads, no I/O on every request.
 *
 * ANNOTATIONS:
 *   @RestController = @Controller + @ResponseBody
 *     — every method return value is serialised to JSON
 *   @RequestMapping("/api") — all routes start with /api
 *   @CrossOrigin — CORS handled here AND in WebConfig for belt+braces
 *
 * Week 7 Day 3
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

    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory course cache — loaded once at startup
    private List<Course> courses = new ArrayList<>();


    /* ── Startup: load courses.json ──────────────────────────── */

    /**
     * loadCourses
     *
     * @PostConstruct runs once after Spring creates this bean,
     * before any request is handled.
     *
     * We try three locations so the app works whether started from:
     *   - the spring-api/ directory  (mvn spring-boot:run)
     *   - the project root           (java -jar ...)
     *   - inside a packaged jar      (classpath fallback)
     */
    @PostConstruct
    public void loadCourses() {
        List<Path> candidates = List.of(
                Paths.get("../data/courses.json"),   // from spring-api/
                Paths.get("data/courses.json"),       // from project root
                Paths.get("courses.json")             // cwd fallback
        );

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                try {
                    courses = objectMapper.readValue(
                            candidate.toFile(),
                            new TypeReference<List<Course>>() {}
                    );
                    System.out.printf("[startup] Loaded %d courses from %s%n",
                            courses.size(), candidate.toAbsolutePath());
                    return;
                } catch (Exception e) {
                    System.err.println("[startup] Failed to parse " + candidate + ": " + e.getMessage());
                }
            }
        }

        // Classpath fallback — works when running as a packaged jar
        try (InputStream is = getClass().getClassLoader()
                .getResourceAsStream("courses.json")) {
            if (is != null) {
                courses = objectMapper.readValue(is, new TypeReference<List<Course>>() {});
                System.out.printf("[startup] Loaded %d courses from classpath%n", courses.size());
                return;
            }
        } catch (Exception e) {
            System.err.println("[startup] Classpath load failed: " + e.getMessage());
        }

        System.err.println("[startup] WARNING: courses.json not found — /api/courses will return empty list");
    }


    /* ── GET /api/health ─────────────────────────────────────── */

    /**
     * Health check — confirms the Spring Boot service is running.
     * Returns the number of loaded courses as a quick data sanity check.
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "ok");
        response.put("service", "skillforge-spring-api");
        response.put("courses", courses.size());
        response.put("timestamp", new Date().toInstant().toString());
        return response;
    }


    /* ── GET /api/courses ────────────────────────────────────── */

    /**
     * Returns all courses, optionally filtered by category or search term.
     *
     * Query params (optional):
     *   ?category=programming   — filter by category slug
     *   ?q=react                — search title, instructor, categoryLabel
     *
     * Response matches the Node.js server format exactly:
     *   { count, total, courses: [...] }
     */
    @GetMapping("/courses")
    public Map<String, Object> getCourses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q
    ) {
        List<Course> result = new ArrayList<>(courses);

        // Optional category filter
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            result = result.stream()
                    .filter(c -> category.equalsIgnoreCase(c.category()))
                    .collect(Collectors.toList());
        }

        // Optional search filter — case-insensitive, checks title + instructor + categoryLabel
        if (q != null && !q.isBlank()) {
            String term = q.toLowerCase().trim();
            result = result.stream()
                    .filter(c ->
                            (c.title()         != null && c.title().toLowerCase().contains(term)) ||
                            (c.instructor()    != null && c.instructor().toLowerCase().contains(term)) ||
                            (c.categoryLabel() != null && c.categoryLabel().toLowerCase().contains(term))
                    )
                    .collect(Collectors.toList());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("count",   result.size());
        response.put("total",   courses.size());
        response.put("courses", result);
        return response;
    }


    /* ── GET /api/courses/{id} ───────────────────────────────── */

    /**
     * Returns a single course by its slug ID.
     *
     * 400 if the ID contains characters outside [a-z0-9-]
     * 404 if no course matches the ID
     * 200 with the course object on success
     *
     * ResponseEntity<Object> lets us return either a Course or
     * an error map, both serialised to JSON.
     */
    @GetMapping("/courses/{id}")
    public ResponseEntity<Object> getCourseById(@PathVariable String id) {

        // Validate ID format — same rule as the Node.js server
        if (!id.matches("^[a-z0-9\\-]{1,80}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid course ID format", "id", id));
        }

        return courses.stream()
                .filter(c -> id.equals(c.id()))
                .findFirst()
                .map(course -> ResponseEntity.ok((Object) course))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(Map.of("error", "Course not found", "id", id)));
    }
}
