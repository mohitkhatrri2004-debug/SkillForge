/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — AUTH PAGE JAVASCRIPT

   Handles the combined Sign Up / Log In page (auth.html).

   RESPONSIBILITIES:
   - Tab switching (Sign Up ↔ Log In)
   - ?tab=login / ?tab=register URL parameter on page load
   - POST /api/auth/register — field validation + API call
   - POST /api/auth/login    — field validation + API call
   - On success: store JWT + user data in localStorage
   - On success: redirect to dashboard
   - Clear error states on input

   STORAGE KEYS WRITTEN:
   - sf_auth_token   — JWT returned by the server
   - sf_auth_user    — JSON-serialised { id, name, email, createdAt }
   - sf_user_name    — display name (written so dashboard/profile work unchanged)

   PASSWORDS ARE NEVER STORED.

   LAST UPDATED: Week 6, Day 4
═══════════════════════════════════════════════════════════════ */


/* ─── Constants ─────────────────────────────────────────────── */
// Environment-aware: localhost → dev server on :3000, deployed → same-origin /api
const API_BASE = (() => {
  const { hostname } = window.location;
  const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
  return isDev ? 'http://localhost:3000/api' : '/api';
})();

const KEY_TOKEN = 'sf_auth_token';
const KEY_USER  = 'sf_auth_user';
const KEY_NAME  = 'sf_user_name';   // read by dashboard.js and profile.js


/* ═══════════════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════════════ */

/**
 * showTab
 *
 * Activates one tab and hides the other.
 * Uses ARIA attributes for accessibility — only the active
 * panel is in the reading order.
 *
 * @param {'register'|'login'} which - which tab to show
 */
function showTab(which) {
  const tabRegister   = document.getElementById('tab-register');
  const tabLogin      = document.getElementById('tab-login');
  const panelRegister = document.getElementById('panel-register');
  const panelLogin    = document.getElementById('panel-login');

  if (!tabRegister || !tabLogin || !panelRegister || !panelLogin) return;

  const isRegister = (which === 'register');

  tabRegister.setAttribute('aria-selected',   isRegister ? 'true' : 'false');
  tabLogin.setAttribute('aria-selected',      isRegister ? 'false' : 'true');

  panelRegister.hidden = !isRegister;
  panelLogin.hidden    = isRegister;

  // Focus the first input in the newly revealed panel
  const firstInput = (isRegister ? panelRegister : panelLogin).querySelector('input');
  if (firstInput) firstInput.focus();
}


/* ═══════════════════════════════════════════════════════════════
   FIELD ERROR HELPERS
═══════════════════════════════════════════════════════════════ */

function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('auth-form__input--error');
  inputEl.setAttribute('aria-describedby', errorEl.id);
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('auth-form__input--error');
  inputEl.removeAttribute('aria-describedby');
  errorEl.textContent = '';
  errorEl.hidden = true;
}

function clearAllFieldErrors(prefix) {
  ['name', 'email', 'password'].forEach(field => {
    const input = document.getElementById(`${prefix}-${field}`);
    const error = document.getElementById(`${prefix}-${field}-error`);
    if (input && error) clearFieldError(input, error);
  });
}


/* ═══════════════════════════════════════════════════════════════
   MESSAGE BANNER
═══════════════════════════════════════════════════════════════ */

function showMessage(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `auth-message auth-message--${type}`;
  el.hidden = false;
  el.style.display = 'block';
}

function hideMessage(id) {
  const el = document.getElementById(id);
  if (el) {
    el.hidden = true;
    el.style.display = 'none';
  }
}


/* ═══════════════════════════════════════════════════════════════
   AUTH STORAGE HELPERS
═══════════════════════════════════════════════════════════════ */

/**
 * saveAuthState
 *
 * Persists the token and user object after a successful
 * register or login. Also writes sf_user_name so the existing
 * dashboard.js and profile.js work without modification.
 *
 * NEVER stores the password — only the values returned by
 * the server ({ id, name, email, createdAt }).
 */
function saveAuthState(token, user) {
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_USER,  JSON.stringify(user));
  localStorage.setItem(KEY_NAME,  user.name);   // consumed by dashboard + profile
}

/**
 * getAuthUser
 *
 * Returns the stored user object, or null if not logged in.
 *
 * @returns {{ id, name, email, createdAt }|null}
 */
function getAuthUser() {
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * isLoggedIn
 *
 * True if a JWT token is present in localStorage.
 * Does NOT validate the token signature (that's the server's job
 * when we add protected routes in Day 5+).
 */
function isLoggedIn() {
  return Boolean(localStorage.getItem(KEY_TOKEN));
}

/**
 * clearAuthState
 *
 * Removes only the auth-specific keys.
 * Does NOT touch sf_saved_courses, sf_enrolled_courses,
 * sf_course_progress, or any other SkillForge data.
 */
function clearAuthState() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
  // NOTE: sf_user_name is left intentionally — the profile page
  // lets users set a display name independently of auth.
  // If you want name to reset on logout, uncomment:
  // localStorage.removeItem(KEY_NAME);
}


/* ═══════════════════════════════════════════════════════════════
   MILESTONE 1 — REGISTER FORM
═══════════════════════════════════════════════════════════════ */

function initRegisterForm() {
  const form          = document.getElementById('register-form');
  const submitBtn     = document.getElementById('register-submit');
  const nameInput     = document.getElementById('register-name');
  const emailInput    = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');

  if (!form) return;

  // Clear errors as user types
  nameInput?.addEventListener('input', () =>
    clearFieldError(nameInput, document.getElementById('register-name-error')));
  emailInput?.addEventListener('input', () =>
    clearFieldError(emailInput, document.getElementById('register-email-error')));
  passwordInput?.addEventListener('input', () =>
    clearFieldError(passwordInput, document.getElementById('register-password-error')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors('register');
    hideMessage('register-message');

    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passwordInput.value;   // do NOT trim passwords

    // ── Client-side validation ──────────────────────────────
    let valid = true;

    if (!name) {
      showFieldError(nameInput, document.getElementById('register-name-error'),
        'Please enter your full name.');
      valid = false;
    } else if (name.length < 2) {
      showFieldError(nameInput, document.getElementById('register-name-error'),
        'Name must be at least 2 characters.');
      valid = false;
    }

    if (!email) {
      showFieldError(emailInput, document.getElementById('register-email-error'),
        'Please enter your email address.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError(emailInput, document.getElementById('register-email-error'),
        'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, document.getElementById('register-password-error'),
        'Please enter a password.');
      valid = false;
    } else if (password.length < 6) {
      showFieldError(passwordInput, document.getElementById('register-password-error'),
        'Password must be at least 6 characters.');
      valid = false;
    }

    if (!valid) return;

    // ── API call ────────────────────────────────────────────
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Server-side validation error (duplicate email, etc.)
        showMessage('register-message', data.error || 'Registration failed. Please try again.', 'error');
        return;
      }

      // ── Success ─────────────────────────────────────────
      saveAuthState(data.token, data.user);
      showMessage('register-message', `✓ Account created! Welcome, ${data.user.name}. Redirecting…`, 'success');

      // Give the user a moment to see the success message, then
      // redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);

    } catch (err) {
      // Network error — server is probably not running
      showMessage('register-message',
        'Cannot connect to the server. Make sure npm run dev is running in the server/ folder.',
        'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   MILESTONE 2 — LOGIN FORM
═══════════════════════════════════════════════════════════════ */

function initLoginForm() {
  const form          = document.getElementById('login-form');
  const submitBtn     = document.getElementById('login-submit');
  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  if (!form) return;

  // Clear errors as user types
  emailInput?.addEventListener('input', () =>
    clearFieldError(emailInput, document.getElementById('login-email-error')));
  passwordInput?.addEventListener('input', () =>
    clearFieldError(passwordInput, document.getElementById('login-password-error')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors('login');
    hideMessage('login-message');

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // ── Client-side validation ──────────────────────────────
    let valid = true;

    if (!email) {
      showFieldError(emailInput, document.getElementById('login-email-error'),
        'Please enter your email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, document.getElementById('login-password-error'),
        'Please enter your password.');
      valid = false;
    }

    if (!valid) return;

    // ── API call ────────────────────────────────────────────
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // 401 → wrong credentials
        showMessage('login-message', data.error || 'Login failed. Please try again.', 'error');
        return;
      }

      // ── Success ─────────────────────────────────────────
      saveAuthState(data.token, data.user);
      showMessage('login-message', `✓ Welcome back, ${data.user.name}! Redirecting…`, 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

    } catch (err) {
      showMessage('login-message',
        'Cannot connect to the server. Make sure npm run dev is running in the server/ folder.',
        'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   REDIRECT ALREADY-LOGGED-IN USERS
═══════════════════════════════════════════════════════════════ */

/**
 * If the user lands on auth.html while already logged in,
 * send them straight to the dashboard — no need to log in again.
 */
function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.replace('dashboard.html');
  }
}


/* ═══════════════════════════════════════════════════════════════
   INIT — runs when DOM is ready (script has defer)
═══════════════════════════════════════════════════════════════ */

(function init() {
  redirectIfLoggedIn();

  // ── Tab switching from URL parameter ─────────────────────
  // ?tab=login  → open login tab
  // ?tab=register (default) → open register tab
  const params = new URLSearchParams(window.location.search);
  const tab    = params.get('tab') || 'register';
  showTab(tab);

  // ── Tab button clicks ─────────────────────────────────────
  document.getElementById('tab-register')?.addEventListener('click', () => showTab('register'));
  document.getElementById('tab-login')?.addEventListener('click',    () => showTab('login'));

  // ── In-panel switch links ─────────────────────────────────
  document.getElementById('switch-to-login')?.addEventListener('click',    () => showTab('login'));
  document.getElementById('switch-to-register')?.addEventListener('click', () => showTab('register'));

  // ── Forms ─────────────────────────────────────────────────
  initRegisterForm();
  initLoginForm();
})();
