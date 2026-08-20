/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — NAVBAR AUTH STATE

   Reads auth state from localStorage and updates the navbar
   on every page.

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

   LAST UPDATED: Week 6, Day 4
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

/**
 * getAuthLink
 *
 * Figures out the correct relative path to auth.html from
 * the current page. Pages in /pages/ use 'auth.html',
 * pages at the root (index.html) use 'pages/auth.html'.
 */
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
 * Finds .navbar__actions on the current page and rewrites its
 * inner HTML based on auth state.
 *
 * Called:
 * - Once on DOMContentLoaded (initial render)
 * - In response to 'storage' events (cross-tab sync)
 */
function updateNavbar() {
  const actionsEl = document.querySelector('.navbar__actions');
  if (!actionsEl) return;

  if (navIsLoggedIn()) {
    const user = navGetUser();
    const displayName = user?.name || localStorage.getItem('sf_user_name') || 'You';
    // Truncate long names to keep navbar tidy
    const shortName = displayName.length > 20 ? displayName.slice(0, 18) + '…' : displayName;

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

    // Wire up logout immediately after injecting
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

/**
 * handleLogout
 *
 * Clears only auth keys, then reloads.
 * localStorage.setItem is used for the removal so that a
 * 'storage' event fires in other open tabs.
 */
function handleLogout() {
  // Remove auth keys
  localStorage.removeItem(NAV_KEY_TOKEN);
  localStorage.removeItem(NAV_KEY_USER);

  // Trigger a storage event for other tabs by writing a sentinel
  // then immediately removing it
  localStorage.setItem('sf_auth_logout', Date.now().toString());
  localStorage.removeItem('sf_auth_logout');

  // Update navbar on this tab immediately
  updateNavbar();

  // Optionally redirect to home if on a protected-feeling page
  // For now, just reload the current page
  window.location.reload();
}


/* ─── Cross-Tab Sync ─────────────────────────────────────────── */

window.addEventListener('storage', (e) => {
  // React when auth keys change in another tab
  if (e.key === NAV_KEY_TOKEN || e.key === NAV_KEY_USER || e.key === 'sf_auth_logout') {
    updateNavbar();
  }
});


/* ─── Init ───────────────────────────────────────────────────── */

// Run as soon as the DOM is ready.
// The script tag uses defer so the DOM is already parsed when this runs.
updateNavbar();
