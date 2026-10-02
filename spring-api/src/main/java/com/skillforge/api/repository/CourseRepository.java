package com.skillforge.api.repository;

import com.skillforge.api.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * CourseRepository — Spring Data MongoDB repository for Course documents.
 *
 * Spring Data automatically implements this interface at runtime.
 * We get findAll(), findById(), save(), count() etc. for free.
 *
 * Custom query methods use Spring Data's method-name convention:
 *   findByCategoryIgnoreCase → SELECT * WHERE category = ? (case-insensitive)
 *
 * The @Query annotation uses MongoDB query syntax for the full-text
 * search across multiple fields.
 *
 * Week 8 Day 2
 */
@Repository
public interface CourseRepository extends MongoRepository<Course, String> {

    /**
     * Find all courses in a given category (case-insensitive).
     * Used by GET /api/courses?category=programming
     */
    List<Course> findByCategoryIgnoreCase(String category);

    /**
     * Full-text search across title, instructor, and categoryLabel.
     * Uses MongoDB $regex operator for case-insensitive partial matching.
     * Used by GET /api/courses?q=react
     */
    @Query("{ '$or': [ " +
           "{ 'title':         { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'instructor':    { '$regex': ?0, '$options': 'i' } }, " +
           "{ 'categoryLabel': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    List<Course> searchCourses(String term);
}
