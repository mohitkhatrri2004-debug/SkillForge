package com.skillforge.api.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.api.model.Course;
import com.skillforge.api.repository.CourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * DataSeeder — one-time import of courses.json into MongoDB Atlas.
 *
 * SAFETY GUARANTEE:
 *   Checks courseRepository.count() before inserting.
 *   If the 'courses' collection already has documents, seeding
 *   is skipped entirely. Restarting the server never duplicates data.
 *
 * RUNS AT:
 *   Startup — implements CommandLineRunner which Spring Boot calls
 *   automatically after the application context is ready.
 *
 * DATA SOURCE PRIORITY (first match wins):
 *   1. ../data/courses.json  — relative to spring-api/ working dir
 *   2. data/courses.json     — if started from project root
 *   3. courses.json on classpath — fallback for packaged jar
 *
 * AFTER SEEDING:
 *   courses.json is NOT deleted — it remains as a local backup.
 *   CourseController switches to MongoDB queries (Milestone 5).
 *
 * Week 8 Day 2
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final ObjectMapper     objectMapper;

    public DataSeeder(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
        this.objectMapper     = new ObjectMapper();
    }

    @Override
    public void run(String... args) throws Exception {

        // ── Safety check: skip if collection already has data ─
        long existing;
        try {
            existing = courseRepository.count();
        } catch (Exception e) {
            System.err.println("[seeder] MongoDB unavailable — skipping seed: " + e.getMessage().split("\\n")[0]);
            return;  // Don't fail startup — CourseController will use JSON fallback
        }

        if (existing > 0) {
            System.out.printf("[seeder] Skipped — %d courses already in MongoDB%n", existing);
            return;
        }

        System.out.println("[seeder] No courses found in MongoDB — importing from courses.json...");

        List<Course> courses = loadFromFile();

        if (courses == null || courses.isEmpty()) {
            System.err.println("[seeder] ERROR: courses.json could not be loaded — aborting seed");
            return;
        }

        // ── Insert all courses in one batch ───────────────────
        try {
            courseRepository.saveAll(courses);
            System.out.printf("[seeder] Successfully imported %d courses into MongoDB 'courses' collection%n",
                    courses.size());
        } catch (Exception e) {
            System.err.println("[seeder] MongoDB write failed — app will use JSON fallback: " + e.getMessage().split("\\n")[0]);
        }
    }

    /**
     * loadFromFile
     *
     * Tries three file paths in order, then falls back to classpath.
     * Returns null if nothing could be loaded.
     */
    private List<Course> loadFromFile() {
        List<Path> candidates = List.of(
                Paths.get("../data/courses.json"),
                Paths.get("data/courses.json"),
                Paths.get("courses.json")
        );

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                try {
                    List<Course> courses = objectMapper.readValue(
                            candidate.toFile(),
                            new TypeReference<List<Course>>() {}
                    );
                    System.out.printf("[seeder] Loaded %d courses from %s%n",
                            courses.size(), candidate.toAbsolutePath());
                    return courses;
                } catch (Exception e) {
                    System.err.printf("[seeder] Failed to parse %s: %s%n",
                            candidate, e.getMessage());
                }
            }
        }

        // Classpath fallback (packaged jar)
        try (InputStream is = getClass().getClassLoader()
                .getResourceAsStream("courses.json")) {
            if (is != null) {
                List<Course> courses = objectMapper.readValue(
                        is, new TypeReference<List<Course>>() {});
                System.out.printf("[seeder] Loaded %d courses from classpath%n", courses.size());
                return courses;
            }
        } catch (Exception e) {
            System.err.println("[seeder] Classpath load failed: " + e.getMessage());
        }

        return null;
    }
}
