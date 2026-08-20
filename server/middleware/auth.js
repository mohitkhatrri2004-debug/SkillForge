/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — JWT AUTH MIDDLEWARE

   Express middleware that verifies a JWT on every protected route.

   USAGE:
     const requireAuth = require('./middleware/auth');
     app.get('/api/me', requireAuth, handler);

   FLOW:
   1. Read the Authorization header
   2. Extract the token from "Bearer <token>"
   3. Verify signature and expiry with jwt.verify()
   4. Attach the decoded payload to req.user
   5. Call next() — the route handler runs
   
   On any failure → 401 Unauthorized, route handler never runs.

   req.user shape after successful verification:
   {
     id:    string  — MongoDB user _id (set in auth routes as user._id)
     email: string  — user's email address
     iat:   number  — issued-at timestamp (set by JWT library)
     exp:   number  — expiry timestamp (set by JWT library)
   }

   LAST UPDATED: Week 7, Day 2
═══════════════════════════════════════════════════════════════ */

const jwt = require('jsonwebtoken');

/**
 * requireAuth
 *
 * Drop-in Express middleware. Add it as the second argument to
 * any route that requires a logged-in user:
 *
 *   app.get('/api/me', requireAuth, getMe);
 *   app.put('/api/me', requireAuth, updateMe);
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  // ── Step 1: Read the Authorization header ──────────────────
  const authHeader = req.headers['authorization'];

  // Header must exist and follow the "Bearer <token>" format.
  // Both checks in one: split gives ["Bearer", "<token>"] or less.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.'
    });
  }

  // ── Step 2: Extract the token ───────────────────────────────
  // "Bearer eyJhbGci..." → "eyJhbGci..."
  const token = authHeader.slice(7); // remove "Bearer " (7 chars)

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.'
    });
  }

  // ── Step 3: Verify signature and expiry ─────────────────────
  // jwt.verify() throws on:
  //   - invalid signature (token was tampered with)
  //   - expired token     (exp < current time)
  //   - malformed token   (not a valid JWT structure)
  // We catch all three and return the same 401 to avoid leaking
  // information about WHY verification failed.
  try {
    const JWT_SECRET = process.env.JWT_SECRET ||
      'skillforge-dev-secret-change-in-production';

    const decoded = jwt.verify(token, JWT_SECRET);

    // ── Step 4: Attach decoded payload to req.user ────────────
    // downstream route handlers read req.user.id / req.user.email
    req.user = {
      id:    decoded.id,
      email: decoded.email
    };

    // ── Step 5: Pass control to the next middleware/handler ───
    next();

  } catch (err) {
    // TokenExpiredError → token is valid but past its expiry date
    // JsonWebTokenError → signature mismatch or malformed token
    // NotBeforeError    → token used before its nbf claim
    // All map to the same 401 — client should redirect to login.
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.'
      });
    }

    return res.status(401).json({
      error: 'Invalid token. Please log in again.'
    });
  }
}

module.exports = requireAuth;
