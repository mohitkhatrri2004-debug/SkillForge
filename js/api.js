/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — API HELPER

   Thin wrapper around fetch() that automatically attaches the
   stored JWT to every request as an Authorization header.

   WHY A SEPARATE FILE:
   Multiple pages will need to make authenticated API calls.
   Centralising the header logic here means:
   - One place to change the token key or header format
   - No copy-pasted Authorization header logic across files
   - Easy to extend with request/response interceptors later

   USAGE:
     // In any page script (after api.js is loaded):
     const user = await getMe();         // GET /api/me
     const updated = await updateMe('New Name');  // PUT /api/me

   STORAGE KEY:
   Reads from sf_auth_token — the same key written by auth.js
   on login/register.

   LAST UPDATED: Week 7, Day 2
═══════════════════════════════════════════════════════════════ */


/* ─── Base URL ───────────────────────────────────────────────── */

// Same environment-aware pattern as courses.js / auth.js
const SF_API_BASE = (() => {
  const { hostname } = window.location;
  const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
  return isDev ? 'http://localhost:3000/api' : '/api';
})();

const SF_TOKEN_KEY = 'sf_auth_token';
const SF_USER_KEY  = 'sf_auth_user';
const SF_NAME_KEY  = 'sf_user_name';


/* ─── Core: apiFetch ─────────────────────────────────────────── */

/**
 * apiFetch
 *
 * Wraps fetch() with:
 *   - Automatic Authorization: Bearer <token> header
 *   - Content-Type: application/json on POST/PUT
 *   - JSON body serialisation
 *   - Throws on non-OK responses with the server's error message
 *
 * @param {string} endpoint  - Path relative to API_BASE, e.g. '/me'
 * @param {object} [options] - fetch options (method, body, etc.)
 * @returns {Promise<object>} - parsed JSON response body
 * @throws {Error}           - with server error message on non-2xx
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(SF_TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${SF_API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Always parse the body — both success and error responses are JSON
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error || `Request failed: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return data;
}


/* ─── User API Methods ───────────────────────────────────────── */

/**
 * getMe
 *
 * Fetches the authenticated user's profile from GET /api/me.
 * Returns null if not logged in or if the request fails.
 *
 * @returns {Promise<{id, name, email, createdAt}|null>}
 */
async function getMe() {
  if (!localStorage.getItem(SF_TOKEN_KEY)) return null;

  try {
    return await apiFetch('/me');
  } catch (err) {
    // 401 means token expired or invalid — clear stale auth state
    if (err.status === 401) {
      localStorage.removeItem(SF_TOKEN_KEY);
      localStorage.removeItem(SF_USER_KEY);
    }
    return null;
  }
}

/**
 * updateMe
 *
 * Updates the authenticated user's display name via PUT /api/me.
 * On success, also updates sf_auth_user and sf_user_name in
 * localStorage so the rest of the app stays in sync.
 *
 * @param {string} name - New display name (2–100 chars)
 * @returns {Promise<{id, name, email, createdAt}>}
 * @throws {Error} with server validation message on failure
 */
async function updateMe(name) {
  const updated = await apiFetch('/me', {
    method: 'PUT',
    body:   JSON.stringify({ name })
  });

  // Keep localStorage in sync with the DB after a successful update
  localStorage.setItem(SF_USER_KEY, JSON.stringify(updated));
  localStorage.setItem(SF_NAME_KEY, updated.name);

  return updated;
}
