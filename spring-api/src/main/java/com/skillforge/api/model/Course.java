package com.skillforge.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

/**
 * Course — MongoDB document model for a SkillForge course.
 *
 * Collection: "courses" in MongoDB Atlas (skillforge database).
 *
 * WHY CONVERTED FROM RECORD TO CLASS (Week 8 Day 2):
 * Java records cannot use @Document or @Id annotations needed
 * by Spring Data MongoDB. A regular class with getters/setters
 * gives full control over MongoDB mapping.
 *
 * IMPORTANT — @Id maps to MongoDB _id:
 * The existing slug-based id ("complete-web-development") becomes
 * the MongoDB _id. This keeps frontend URLs and API responses
 * identical to the JSON-file version — zero frontend changes needed.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true):
 * Safe forward compatibility — new fields in the DB are ignored
 * rather than causing deserialisation errors.
 */
@Document(collection = "courses")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Course {

    // ── Core identifiers ─────────────────────────────────────
    @Id
    private String id;          // MongoDB _id = slug ("complete-web-development")

    private String title;
    private String description;
    private String longDescription;

    // ── Classification ────────────────────────────────────────
    @Indexed                    // index for fast category filtering
    private String category;
    private String categoryLabel;
    private String level;
    private String levelLabel;

    // ── Instructor ────────────────────────────────────────────
    private String instructor;
    private String instructorTitle;
    private String instructorBio;
    private String instructorRating;
    private String instructorStudents;
    private String instructorCourses;

    // ── Stats ─────────────────────────────────────────────────
    private Double rating;
    private String ratingCount;
    private String students;
    private String duration;
    private String updatedDate;

    // ── Rich content ──────────────────────────────────────────
    private List<Object> objectives;
    private List<Object> curriculum;
    private List<Object> reviews;

    // ── No-arg constructor required by Spring Data MongoDB ────
    public Course() {}

    // ── Getters ───────────────────────────────────────────────
    public String getId()               { return id; }
    public String getTitle()            { return title; }
    public String getDescription()      { return description; }
    public String getLongDescription()  { return longDescription; }
    public String getCategory()         { return category; }
    public String getCategoryLabel()    { return categoryLabel; }
    public String getLevel()            { return level; }
    public String getLevelLabel()       { return levelLabel; }
    public String getInstructor()       { return instructor; }
    public String getInstructorTitle()  { return instructorTitle; }
    public String getInstructorBio()    { return instructorBio; }
    public String getInstructorRating() { return instructorRating; }
    public String getInstructorStudents(){ return instructorStudents; }
    public String getInstructorCourses(){ return instructorCourses; }
    public Double getRating()           { return rating; }
    public String getRatingCount()      { return ratingCount; }
    public String getStudents()         { return students; }
    public String getDuration()         { return duration; }
    public String getUpdatedDate()      { return updatedDate; }
    public List<Object> getObjectives() { return objectives; }
    public List<Object> getCurriculum() { return curriculum; }
    public List<Object> getReviews()    { return reviews; }

    // ── Setters (required for Jackson + Spring Data deserialization) ──
    public void setId(String id)                         { this.id = id; }
    public void setTitle(String title)                   { this.title = title; }
    public void setDescription(String description)       { this.description = description; }
    public void setLongDescription(String longDescription){ this.longDescription = longDescription; }
    public void setCategory(String category)             { this.category = category; }
    public void setCategoryLabel(String categoryLabel)   { this.categoryLabel = categoryLabel; }
    public void setLevel(String level)                   { this.level = level; }
    public void setLevelLabel(String levelLabel)         { this.levelLabel = levelLabel; }
    public void setInstructor(String instructor)         { this.instructor = instructor; }
    public void setInstructorTitle(String instructorTitle){ this.instructorTitle = instructorTitle; }
    public void setInstructorBio(String instructorBio)   { this.instructorBio = instructorBio; }
    public void setInstructorRating(String instructorRating){ this.instructorRating = instructorRating; }
    public void setInstructorStudents(String instructorStudents){ this.instructorStudents = instructorStudents; }
    public void setInstructorCourses(String instructorCourses){ this.instructorCourses = instructorCourses; }
    public void setRating(Double rating)                 { this.rating = rating; }
    public void setRatingCount(String ratingCount)       { this.ratingCount = ratingCount; }
    public void setStudents(String students)             { this.students = students; }
    public void setDuration(String duration)             { this.duration = duration; }
    public void setUpdatedDate(String updatedDate)       { this.updatedDate = updatedDate; }
    public void setObjectives(List<Object> objectives)   { this.objectives = objectives; }
    public void setCurriculum(List<Object> curriculum)   { this.curriculum = curriculum; }
    public void setReviews(List<Object> reviews)         { this.reviews = reviews; }
}
