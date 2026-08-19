/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — EXPRESS SERVER

   Minimal REST API serving course data.
   Runs on http://localhost:3000

   ENDPOINTS (Day 1):
   GET /api/courses          → all 12 courses
   GET /api/courses/:id      → single course by ID

   ARCHITECTURE:
   - CommonJS modules (require/module.exports)
   - courses.json is the single data source
   - CORS enabled for localhost:5500 (Live Server)

   START:
   npm run dev   → nodemon (auto-restart on changes)
   npm start     → plain node (production)

   LAST UPDATED: Week 6, Day 1
═══════════════════════════════════════════════════════════════ */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

/* ─── App Setup ─────────────────────────────────────────────── */

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── Middleware ────────────────────────────────────────────── */

// Parse incoming JSON request bodies
app.use(express.json());

// CORS — allow requests from Live Server (port 5500) and file://
// In production this would be locked to your real domain.
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'null'                    // for file:// protocol during dev
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ─── Data Loading ──────────────────────────────────────────── */

/**
 * loadCourses
 *
 * Reads courses.json from the /data directory.
 * Uses a relative path from the project root — works whether
 * you start the server from /server or the project root.
 *
 * We read the file synchronously on startup (not on every request)
 * and cache the result. In Week 9 this will be replaced by a
 * MongoDB query.
 */
function loadCourses() {
  const dataPath = path.join(__dirname, '..', 'data', 'courses.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`courses.json not found at: ${dataPath}`);
    return [];
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

// Cache on startup — array of course objects
const courses = loadCourses();
console.log(`Loaded ${courses.length} courses from courses.json`);

/* ─── Routes ────────────────────────────────────────────────── */

/**
 * GET /api/courses
 *
 * Returns all courses as a JSON array.
 * Supports optional query params:
 *   ?category=programming  → filter by category slug
 *   ?q=react               → search by title (case-insensitive)
 */
app.get('/api/courses', (req, res) => {
  let result = [...courses]; // work on a copy — never mutate the cache

  // Optional category filter
  const { category, q } = req.query;

  if (category && category !== 'all') {
    result = result.filter(c => c.category === category);
  }

  // Optional search filter
  if (q) {
    const term = q.toLowerCase().trim();
    result = result.filter(c =>
      c.title.toLowerCase().includes(term) ||
      c.instructor.toLowerCase().includes(term) ||
      c.categoryLabel.toLowerCase().includes(term)
    );
  }

  res.json({
    count: result.length,
    total: courses.length,
    courses: result
  });
});


/**
 * GET /api/courses/:id
 *
 * Returns a single course by its ID slug.
 * Validates the ID format before searching.
 * Responds with 400 for malformed IDs, 404 if not found.
 */
app.get('/api/courses/:id', (req, res) => {
  const { id } = req.params;

  // Validate: only lowercase letters, numbers, hyphens — max 80 chars
  // This prevents path traversal attempts and nonsense queries
  if (!/^[a-z0-9-]{1,80}$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid course ID format',
      id
    });
  }

  const course = courses.find(c => c.id === id);

  if (!course) {
    return res.status(404).json({
      error: 'Course not found',
      id
    });
  }

  res.json(course);
});


/**
 * GET /api/health
 *
 * Simple health-check endpoint.
 * Useful for confirming the server is running.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    courses: courses.length,
    timestamp: new Date().toISOString()
  });
});


/* ─── 404 Handler ───────────────────────────────────────────── */

// Catch any route not matched above
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});


/* ─── Error Handler ─────────────────────────────────────────── */

// Catches any unhandled errors thrown inside route handlers
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});


/* ─── Start ─────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`SkillForge API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`All courses:  http://localhost:${PORT}/api/courses`);
});
