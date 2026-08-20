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
      // No minlength here — the hash is always 60 chars from bcrypt.
      // Validation of the original password happens in the route,
      // before hashing.
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
        delete ret.passwordHash; // never send the hash to the client
        delete ret.__v;          // internal Mongoose version key
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
