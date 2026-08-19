/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — EXPRESS SERVER

   Minimal REST API serving course data and authentication.
   Runs on http://localhost:3000

   ENDPOINTS (Day 1):
   GET  /api/courses          → all 12 courses
   GET  /api/courses/:id      → single course by ID

   ENDPOINTS (Day 3):
   POST /api/auth/register    → create account, returns JWT
   POST /api/auth/login       → verify credentials, returns JWT

   ARCHITECTURE:
   - CommonJS modules (require/module.exports)
   - courses.json is the single data source
   - In-memory users array (replaced by DB in a later week)
   - CORS enabled for localhost:5500 (Live Server)
   - Passwords hashed with bcryptjs (salt rounds: 10)
   - Auth tokens are JWTs signed with JWT_SECRET

   START:
   npm run dev   → nodemon (auto-restart on changes)
   npm start     → plain node (production)

   LAST UPDATED: Week 6, Day 3
═══════════════════════════════════════════════════════════════ */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

/* ─── App Setup ─────────────────────────────────────────────── */

const app  = express();
const PORT = process.env.PORT || 3000;

// In production this must be a long random string stored in .env
// For dev we use a hardcoded fallback so the server starts without config.
const JWT_SECRET     = process.env.JWT_SECRET || 'skillforge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

/* ─── In-Memory User Store ──────────────────────────────────── */

/**
 * users — array of { id, name, email, passwordHash, createdAt }
 *
 * Lives in memory: resets on server restart.
 * Week 8+ will replace this with a real database.
 * Passwords are NEVER stored in plain text — only the bcrypt hash.
 */
const users = [];

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


/* ─── Auth Routes ───────────────────────────────────────────── */

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 *
 * Request body:
 *   { name: string, email: string, password: string }
 *
 * Validations:
 *   - All three fields required
 *   - email must match basic RFC-5322 pattern
 *   - password minimum 6 characters
 *   - email must not already be registered
 *
 * On success → 201 { token, user: { id, name, email, createdAt } }
 * On error   → 400 { error: string }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Field presence ──────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are all required' });
    }

    const trimmedName  = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPass  = String(password);

    // ── Name length ─────────────────────────────────────────────
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ error: 'name must be between 2 and 100 characters' });
    }

    // ── Email format ────────────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // ── Password length ─────────────────────────────────────────
    if (trimmedPass.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    // ── Duplicate email check ───────────────────────────────────
    const existing = users.find(u => u.email === trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with that email already exists' });
    }

    // ── Hash password ───────────────────────────────────────────
    // saltRounds=10 → ~100ms on modern hardware, safe default
    const passwordHash = await bcrypt.hash(trimmedPass, 10);

    // ── Create user record ──────────────────────────────────────
    const user = {
      id:           `user_${Date.now()}`,
      name:         trimmedName,
      email:        trimmedEmail,
      passwordHash,                       // never sent to client
      createdAt:    new Date().toISOString()
    };

    users.push(user);

    // ── Sign JWT ────────────────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ── Respond — exclude passwordHash ──────────────────────────
    res.status(201).json({
      token,
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * POST /api/auth/login
 *
 * Authenticates an existing user.
 *
 * Request body:
 *   { email: string, password: string }
 *
 * Validations:
 *   - Both fields required
 *   - email must exist in the users store
 *   - password must match the stored bcrypt hash
 *
 * NOTE: We deliberately use the same error message for "not found"
 * and "wrong password" — this prevents email enumeration attacks.
 *
 * On success → 200 { token, user: { id, name, email, createdAt } }
 * On error   → 400 { error } | 401 { error }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Field presence ──────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPass  = String(password);

    // ── Find user ───────────────────────────────────────────────
    const user = users.find(u => u.email === trimmedEmail);

    // ── Verify password ─────────────────────────────────────────
    // bcrypt.compare is safe even when user is undefined (timing-safe)
    // We always compare to prevent timing attacks that could reveal
    // whether an email exists.
    const passwordHash = user ? user.passwordHash : '$2a$10$invalidhashfortimingprotection00000000000000000000000';
    const match = await bcrypt.compare(trimmedPass, passwordHash);

    if (!user || !match) {
      // Deliberately vague — prevents email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ── Sign JWT ────────────────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ── Respond — exclude passwordHash ──────────────────────────
    res.json({
      token,
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
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
