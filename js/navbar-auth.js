/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — NAVBAR AUTH STATE

   Reads auth state from localStorage and updates the navbar
   on every page. Also refreshes user data from GET /api/me
   on load so the displayed name stays in sync with the database.

   INCLUDED ON: all pages via <script src="js/navbar-auth.js" defer>

   LOGGED OUT navbar__actions:
     👤 Profile  |  Log In (ghost)  |  Sign Up Free (primary)

   LOGGED IN navbar__actions:
     👤 <name> (links to profile)  |  Log Out (ghost button)

   LOGOUT:
   - Removes sf_auth_token and sf_auth_user from localStorage
   - Does NOT remove sf_saved_courses, sf_enrolled_courses,
     sf_course_progress, sf_user_name, or any other learning data
   - Reloads the current page so all components reflect logged-out state
   - Cross-tab: a storage event fires so other open tabs update too

   LAST UPDATED: Week 7, Day 2
═══════════════════════════════════════════════════════════════ */


/* ─── Storage Keys ───────────────────────────────────────────── */

const NAV_KEY_TOKEN = 'sf_auth_token';
const NAV_KEY_USER  = 'sf_auth_user';


/* ─── Helpers ────────────────────────────────────────────────── */

function navIsLoggedIn() {
  return Boolean(localStorage.getItem(NAV_KEY_TOKEN));
}

function navGetUser() {
  try {
    return JSON.parse(localStorage.getItem(NAV_KEY_USER) || 'null');
  } catch {
    return null;
  }
}

function getAuthLink(tab) {
  const isRoot = !window.location.pathname.includes('/pages/');
  const base   = isRoot ? 'pages/auth.html' : 'auth.html';
  return `${base}?tab=${tab}`;
}

function getProfileLink() {
  const isRoot = !window.location.pathname.includes('/pages/');
  return isRoot ? 'pages/profile.html' : 'profile.html';
}


/* ─── Core: updateNavbar ─────────────────────────────────────── */

/**
 * updateNavbar
 *
 * Renders the navbar__actions block based on current auth state.
 * Accepts an optional user object so callers can pass fresh DB
 * data without re-reading localStorage.
 *
 * @param {object|null} [freshUser] - User object from GET /api/me
 */
function updateNavbar(freshUser) {
  const actionsEl = document.querySelector('.navbar__actions');
  if (!actionsEl) return;

  if (navIsLoggedIn()) {
    // Prefer freshUser (from DB) over stale localStorage copy
    const user        = freshUser || navGetUser();
    const displayName = user?.name || localStorage.getItem('sf_user_name') || 'You';
    const shortName   = displayName.length > 20
      ? displayName.slice(0, 18) + '…'
      : displayName;

    actionsEl.innerHTML = `
      <a href="${getProfileLink()}"
         class="navbar__link navbar__link--profile"
         aria-label="My Profile — ${displayName}">
        👤 ${shortName}
      </a>
      <button
        class="navbar__btn navbar__btn--ghost"
        id="logout-btn"
        type="button"
        aria-label="Log out of SkillForge">
        Log Out
      </button>`;

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  } else {
    actionsEl.innerHTML = `
      <a href="${getProfileLink()}"
         class="navbar__link navbar__link--profile"
         aria-label="My Profile">
        👤 Profile
      </a>
      <a href="${getAuthLink('login')}"
         class="navbar__btn navbar__btn--ghost">
        Log In
      </a>
      <a href="${getAuthLink('register')}"
         class="navbar__btn navbar__btn--primary">
        Sign Up Free
      </a>`;
  }
}


/* ─── Logout Handler ─────────────────────────────────────────── */

function handleLogout() {
  localStorage.removeItem(NAV_KEY_TOKEN);
  localStorage.removeItem(NAV_KEY_USER);

  // Sentinel write/remove triggers 'storage' event in other tabs
  localStorage.setItem('sf_auth_logout', Date.now().toString());
  localStorage.removeItem('sf_auth_logout');

  updateNavbar();
  window.location.reload();
}


/* ─── Cross-Tab Sync ─────────────────────────────────────────── */

window.addEventListener('storage', (e) => {
  if (e.key === NAV_KEY_TOKEN || e.key === NAV_KEY_USER || e.key === 'sf_auth_logout') {
    updateNavbar();
  }
});


/* ─── Init ───────────────────────────────────────────────────── */

/**
 * Render the navbar immediately from localStorage (instant, no
 * network wait), then silently refresh user data from the DB.
 * If the DB returns a fresher name, re-render and save to storage.
 *
 * WHY two-phase:
 * The first render is synchronous so the navbar appears instantly
 * without a flash of "Log In" buttons for logged-in users.
 * The background fetch corrects stale data without the user
 * noticing any delay.
 *
 * api.js (which provides getMe()) must be loaded on the same page.
 * Pages that don't include api.js get only the localStorage render,
 * which is the correct graceful-degradation behaviour.
 */
(async function init() {
  // Phase 1: render immediately from localStorage
  updateNavbar();

  // Phase 2: if logged in and api.js is available, fetch fresh data
  if (!navIsLoggedIn()) return;
  if (typeof getMe !== 'function') return; // api.js not loaded on this page

  const freshUser = await getMe();

  if (!freshUser) {
    // getMe() returned null — token was invalid/expired, already cleared
    updateNavbar();
    return;
  }

  // Update localStorage if name changed in DB
  const stored = navGetUser();
  if (stored?.name !== freshUser.name) {
    localStorage.setItem(NAV_KEY_USER, JSON.stringify(freshUser));
    localStorage.setItem('sf_user_name', freshUser.name);
  }

  // Re-render navbar with fresh name
  updateNavbar(freshUser);
})();
