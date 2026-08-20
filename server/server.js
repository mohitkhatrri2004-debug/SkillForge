/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — EXPRESS SERVER

   REST API serving course data and authentication.
   Runs on http://localhost:3000 by default.

   ENDPOINTS:
   GET  /api/health           → server status
   GET  /api/courses          → all courses (optional ?category= ?q=)
   GET  /api/courses/:id      → single course by slug ID
   POST /api/auth/register    → create account, returns JWT
   POST /api/auth/login       → verify credentials, returns JWT

   ARCHITECTURE:
   - CommonJS modules (require/module.exports)
   - dotenv loads environment variables from .env at startup
   - courses.json is the single data source (cached at startup)
   - In-memory users array (replaced by DB in a later week)
   - CORS restricted to origins listed in ALLOWED_ORIGINS env var
   - Passwords hashed with bcryptjs (salt rounds: 10)
   - Auth tokens are JWTs signed with JWT_SECRET env var

   START:
   npm run dev   → nodemon (auto-restart on changes)
   npm start     → plain node (production)

   ENVIRONMENT:
   Copy server/.env.example to server/.env and fill in values.
   Required: JWT_SECRET
   Optional: PORT (default 3000), ALLOWED_ORIGINS

   LAST UPDATED: Week 6, Day 5
═══════════════════════════════════════════════════════════════ */

/* ─── Load Environment Variables ────────────────────────────── */

// dotenv.config() must be called before any process.env access.
// It reads server/.env and populates process.env.
// If .env is missing (e.g. on a CI server that injects vars
// directly) dotenv simply does nothing — no crash.
require('dotenv').config();


/* ─── Dependencies ───────────────────────────────────────────── */

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const connectDB = require('./db');
const User      = require('./models/User');


/* ─── App Setup ─────────────────────────────────────────────── */

const app  = express();
const PORT = process.env.PORT || 3000;

// JWT_SECRET must be set via .env in production.
// The fallback keeps the dev server working without a .env file,
// but logs a warning so developers notice they should set it.
const JWT_SECRET = process.env.JWT_SECRET || 'skillforge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

if (!process.env.JWT_SECRET) {
  console.warn(
    '\n⚠  WARNING: JWT_SECRET is not set in .env — using insecure development default.\n' +
    '   Copy server/.env.example to server/.env and set a real secret.\n'
  );
}


/* ─── In-Memory User Store ──────────────────────────────────── */


/* ─── CORS Configuration ─────────────────────────────────────── */

/**
 * parseAllowedOrigins
 *
 * Reads the ALLOWED_ORIGINS environment variable and returns
 * a cleaned array of origin strings.
 *
 * ALLOWED_ORIGINS in .env is a comma-separated list:
 *   http://127.0.0.1:5500,http://localhost:5500
 *
 * Falls back to localhost Live Server defaults for development.
 */
function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;

  if (raw) {
    return raw
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
  }

  // Development fallback — Live Server default ports
  return [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501'
  ];
}

const ALLOWED_ORIGINS = parseAllowedOrigins();
console.log('CORS allowed origins:', ALLOWED_ORIGINS);

/**
 * corsOptions
 *
 * Dynamic CORS origin check.
 *
 * WHY dynamic instead of a static array:
 * The static `origin: [...]` form silently allows requests with
 * no Origin header (e.g. curl, Postman, same-origin server calls).
 * The function form lets us log and control every decision.
 *
 * origin === undefined → same-origin or non-browser tool → allow
 * origin === 'null'    → file:// protocol during dev → allow
 * origin in list       → known frontend → allow
 * anything else        → reject with 403
 */
const corsOptions = {
  origin(origin, callback) {
    // No Origin header = same-origin request or non-browser tool (curl, Postman)
    if (!origin) return callback(null, true);

    // file:// protocol sends origin 'null' — allow during development
    if (origin === 'null') return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Unknown origin — reject
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Allow credentials so Authorization header works in fetch calls
  credentials: true
};


/* ─── Middleware ─────────────────────────────────────────────── */

// Apply CORS before any route handler
app.use(cors(corsOptions));

// Parse incoming JSON request bodies.
// If the body is malformed JSON, Express throws a SyntaxError
// which is caught by the error handler below.
app.use(express.json());


/* ─── Data Loading ───────────────────────────────────────────── */

/**
 * loadCourses
 *
 * Reads courses.json from the /data directory at startup.
 * Cached once — never re-read on each request.
 * Week 9+ replaces this with a MongoDB query.
 */
function loadCourses() {
  const dataPath = path.join(__dirname, '..', 'data', 'courses.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`[startup] courses.json not found at: ${dataPath}`);
    return [];
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

const courses = loadCourses();
console.log(`[startup] Loaded ${courses.length} courses from courses.json`);


/* ─── Routes ─────────────────────────────────────────────────── */

/**
 * GET /api/health
 * Quick liveness check — useful for uptime monitoring.
 */
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      status:    'ok',
      courses:   courses.length,
      users:     userCount,
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    // DB might be temporarily unreachable — still return a response
    res.json({
      status:    'degraded',
      courses:   courses.length,
      users:     null,
      timestamp: new Date().toISOString(),
      env:       process.env.NODE_ENV || 'development'
    });
  }
});


/**
 * GET /api/courses
 * Returns all courses. Supports ?category= and ?q= filters.
 */
app.get('/api/courses', (req, res) => {
  let result = [...courses];

  const { category, q } = req.query;

  if (category && category !== 'all') {
    result = result.filter(c => c.category === category);
  }

  if (q) {
    const term = q.toLowerCase().trim();
    result = result.filter(c =>
      c.title.toLowerCase().includes(term) ||
      c.instructor.toLowerCase().includes(term) ||
      c.categoryLabel.toLowerCase().includes(term)
    );
  }

  res.json({
    count:   result.length,
    total:   courses.length,
    courses: result
  });
});


/**
 * GET /api/courses/:id
 * Returns a single course by its slug ID.
 */
app.get('/api/courses/:id', (req, res) => {
  const { id } = req.params;

  if (!/^[a-z0-9-]{1,80}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid course ID format', id });
  }

  const course = courses.find(c => c.id === id);

  if (!course) {
    return res.status(404).json({ error: 'Course not found', id });
  }

  res.json(course);
});


/* ─── Auth Routes ────────────────────────────────────────────── */

/**
 * POST /api/auth/register
 *
 * Body: { name, email, password }
 * Returns: 201 { token, user: { id, name, email, createdAt } }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are all required' });
    }

    const trimmedName  = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPass  = String(password);

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ error: 'name must be between 2 and 100 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (trimmedPass.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    // ── Duplicate email check — now queries MongoDB ─────────
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with that email already exists' });
    }

    // ── Hash password (unchanged from Day 3) ────────────────
    const passwordHash = await bcrypt.hash(trimmedPass, 10);

    // ── Persist to MongoDB ───────────────────────────────────
    // new User({...}).save() writes the document to the 'users'
    // collection. Mongoose sets _id and createdAt automatically.
    // The schema's toJSON transform strips passwordHash before
    // the document is serialised, but we build the response
    // manually below to keep the format the frontend expects.
    const user = await new User({
      name:         trimmedName,
      email:        trimmedEmail,
      passwordHash
    }).save();

    // ── Sign JWT (unchanged from Day 3) ─────────────────────
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ── Respond — same shape the frontend already expects ───
    // user._id is a MongoDB ObjectId; .toString() gives a
    // plain string identical in behaviour to the old user_${Date.now()} id.
    res.status(201).json({
      token,
      user: {
        id:        user._id.toString(),
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Returns: 200 { token, user: { id, name, email, createdAt } }
 *
 * Uses the same 401 message for "not found" and "wrong password"
 * to prevent email enumeration attacks.
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPass  = String(password);

    // ── Look up user in MongoDB ──────────────────────────────
    const user = await User.findOne({ email: trimmedEmail });

    // Always run bcrypt.compare even when user is not found,
    // to prevent timing-based email enumeration.
    const hashToCheck = user
      ? user.passwordHash
      : '$2a$10$invalidhashfortimingprotection00000000000000000000000';

    const match = await bcrypt.compare(trimmedPass, hashToCheck);

    if (!user || !match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ── Sign JWT (unchanged from Day 3) ─────────────────────
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // ── Respond — same shape the frontend expects ────────────
    res.json({
      token,
      user: {
        id:        user._id.toString(),
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/* ─── 404 Handler ────────────────────────────────────────────── */

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});


/* ─── Global Error Handler ───────────────────────────────────── */

/**
 * Catches errors thrown inside route handlers AND middleware,
 * including malformed JSON body (SyntaxError from express.json()).
 *
 * The four-parameter signature (err, req, res, next) is required
 * by Express to recognise this as an error-handling middleware.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON body → 400, not 500
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  // CORS rejection — set by our corsOptions callback
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  console.error('[server error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});


/* ─── Process-Level Error Guards ─────────────────────────────── */

/**
 * Catch unhandled promise rejections (async bugs that slipped
 * past try/catch). Logs the error but does not crash the process
 * during development. In production you'd want to exit and let
 * the process manager (PM2, Docker) restart the server.
 */
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

/**
 * Catch uncaught synchronous exceptions.
 * Same philosophy — log but don't silently swallow.
 */
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message);
});


/* ─── Start ──────────────────────────────────────────────────── */

/**
 * Connect to MongoDB first, then start listening.
 * If connectDB() throws (bad URI, network error), the process
 * exits before binding to a port — no silent broken server.
 */
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\nSkillForge API running at http://localhost:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/api/health`);
    console.log(`  Courses: http://localhost:${PORT}/api/courses\n`);
  });
}

startServer().catch(err => {
  console.error('[startup error]', err.message);
  process.exit(1);
});
