package com.skillforge.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Course — data model for a SkillForge course.
 *
 * WHY A RECORD:
 * Java records (Java 16+) are immutable data carriers.
 * The compiler auto-generates constructor, getters, equals,
 * hashCode, and toString — no Lombok needed.
 * Jackson deserialises JSON into records automatically.
 *
 * WHY @JsonIgnoreProperties(ignoreUnknown = true):
 * If courses.json gains new fields in the future, the
 * deserialiser won't throw an exception — it just ignores
 * fields it doesn't know about. Safe forward compatibility.
 *
 * FIELDS match the courses.json structure exactly so the
 * frontend receives the same JSON shape it already expects.
 *
 * Week 7 Day 3 — read from courses.json
 * Future: replaced by MongoDB document mapping
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Course(
        // ── Core identifiers ─────────────────────────────────
        String id,
        String title,
        String description,
        String longDescription,

        // ── Classification ────────────────────────────────────
        String category,
        String categoryLabel,
        String level,
        String levelLabel,

        // ── Instructor ────────────────────────────────────────
        String instructor,
        String instructorTitle,
        String instructorBio,
        String instructorRating,
        String instructorStudents,
        String instructorCourses,

        // ── Stats ─────────────────────────────────────────────
        Double rating,
        String ratingCount,
        String students,
        String duration,
        String updatedDate,

        // ── Rich content ─────────────────────────────────────
        // List<Object> handles any nested JSON structure
        // (arrays of strings, arrays of objects, etc.)
        List<Object> objectives,
        List<Object> curriculum,
        List<Object> reviews
) {}
