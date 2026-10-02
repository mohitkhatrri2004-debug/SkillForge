/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — USER MODEL

   Defines the Mongoose schema and model for a SkillForge user.

   COLLECTION: 'users' (Mongoose pluralises 'User' automatically)

   FIELDS:
   name          String   User's display name (2–100 chars)
   email         String   Unique, case-insensitive login identifier
   passwordHash  String   bcrypt hash — NEVER the plain password
   createdAt     Date     Set automatically on first save

   INDEXES:
   email has a unique index — MongoDB rejects duplicate emails
   at the database level, independently of application code.

   WHY NO EXTRA FIELDS YET:
   Fields like avatar, bio, enrolledCourses, savedCourses are
   intentionally omitted. They can be added in later weeks when
   we move that data from localStorage to the database.
   Starting minimal keeps the schema easy to understand and test.

   LAST UPDATED: Week 7, Day 1
═══════════════════════════════════════════════════════════════ */

const mongoose = require('mongoose');

/* ─── Schema ─────────────────────────────────────────────────── */

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,   'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be 100 characters or fewer']
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,       // creates a MongoDB unique index
      lowercase: true,       // stored as lowercase regardless of input
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },

    passwordHash: {
      type:     String,
      required: [true, 'Password hash is required']
    },

    // ── Week 8 Day 3 — Enrollment + Progress ──────────────────
    // These replace localStorage as the source of truth.
    // Existing users get empty arrays/maps by default (sparse: true
    // means MongoDB won't index documents where the field is absent).

    enrolledCourses: {
      type:    [String],   // array of course ID slugs
      default: []
    },

    courseProgress: {
      // Map from course ID → progress percentage (0–100)
      // e.g. { "complete-web-development": 75 }
      type:    Map,
      of:      Number,
      default: {}
    },

    completedCourses: {
      type:    [String],   // course IDs where progress reached 100
      default: []
    }
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields.
    // createdAt is set once on insert; updatedAt changes on every save.
    timestamps: true,

    // Strip any fields not in the schema when converting to JSON.
    // This is an extra safety layer — passwordHash is excluded
    // explicitly in the route responses, but toJSON protects
    // against accidentally sending it in the future.
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        // Convert courseProgress Map to a plain object for JSON
        if (ret.courseProgress instanceof Map) {
          ret.courseProgress = Object.fromEntries(ret.courseProgress);
        }
        return ret;
      }
    }
  }
);

/* ─── Model ──────────────────────────────────────────────────── */

// mongoose.model() compiles the schema into a Model class.
// 'User' → collection name 'users' (auto-pluralised, lowercase).
// The guard prevents "Cannot overwrite model once compiled" errors
// if this file is required more than once (e.g. in tests).
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
