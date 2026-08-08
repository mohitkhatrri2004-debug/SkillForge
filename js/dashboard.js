/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — DASHBOARD PAGE JAVASCRIPT

   Reads user state from localStorage, fetches course data,
   and renders the personalised dashboard experience.

   FLOW:
   1. Read user name from localStorage (or use default)
   2. Read saved/enrolled/completed course IDs from localStorage
   3. Fetch all course data from courses.json
   4. Match saved IDs against full course objects
   5. Render welcome section, stats, saved courses grid
   6. Show empty state if nothing is saved

   ARCHITECTURE:
   - Same async/await + try/catch pattern as course-detail.js
   - Same data-field targeting pattern as course-detail.js
   - Pure rendering functions with no side effects
   - Backend-ready: only two lines need changing to use a real API

   DEPENDENCIES:
   - pages/dashboard.html  (data-field render targets)
   - data/courses.json     (full course data source)
   - localStorage keys:
       sf_user_name         user's display name
       sf_saved_courses     array of saved course IDs
       sf_enrolled_courses  array of enrolled course IDs
       sf_completed_courses array of completed course IDs

   LAST UPDATED: Week 4, Day 1
═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   STORAGE KEYS

   Same sf_ prefix convention used across the project.
   Defined as constants to prevent typos.
═══════════════════════════════════════════════════════════════ */

const DB_KEY_USER_NAME  = 'sf_user_name';
const DB_KEY_SAVED      = 'sf_saved_courses';
const DB_KEY_ENROLLED   = 'sf_enrolled_courses';
const DB_KEY_COMPLETED  = 'sf_completed_courses';


/* ═══════════════════════════════════════════════════════════════
   HELPER: fill()

   Sets textContent on a [data-field] element.
   Identical to the helper in course-detail.js — same pattern,
   different file scope.

   @param {string} fieldName  - The data-field attribute value
   @param {string} value      - Text to set
═══════════════════════════════════════════════════════════════ */
function fill(fieldName, value) {
  const el = document.querySelector(`[data-field="${fieldName}"]`);
  if (!el) return;
  el.textContent = value;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: getStoredArray()

   Safely reads a JSON array from localStorage.
   Returns an empty array if the key doesn't exist yet.

   WHY A HELPER:
   Every stat (saved, enrolled, completed) uses the same pattern:
   JSON.parse(localStorage.getItem(key) || '[]')
   Extracting it avoids repeating this three times.

   @param  {string}   key - localStorage key name
   @returns {string[]}    - Array of IDs (empty if nothing stored)
═══════════════════════════════════════════════════════════════ */
function getStoredArray(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: getTimeGreeting()

   Returns an appropriate greeting based on the current hour.
   Makes the welcome section feel dynamic and personal.

   @returns {string} "Good morning", "Good afternoon", or "Good evening"
═══════════════════════════════════════════════════════════════ */
function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: buildDashCard()

   Pure function — takes one course object and returns an HTML
   string for a .dash-card element.

   WHY DIFFERENT FROM buildCardHTML() in courses.js:
   The catalog card is built for discovery (larger image, more detail,
   save button). The dashboard card is built for quick return —
   compact, shows rating and instructor, links directly to the
   course detail page. Different jobs, different templates.

   @param  {Object} course - Full course object from courses.json
   @returns {string}       - HTML string for one dashboard card
═══════════════════════════════════════════════════════════════ */
function buildDashCard(course, progress = null) {
  const badgeModifier = course.level !== 'beginner'
    ? ` dash-card__badge--${course.level}`
    : '';

  // Build progress bar HTML only when a progress value is provided
  // (enrolled cards) — saved and recommended cards get nothing
  const progressHTML = progress !== null ? `
    <div class="progress-bar" role="progressbar"
         aria-valuenow="${progress}"
         aria-valuemin="0" aria-valuemax="100"
         aria-label="${progress}% complete">
      <div class="progress-bar__fill ${progress >= 100 ? 'progress-bar__fill--complete' : ''}"
           style="width: ${progress}%"></div>
    </div>
    <div class="dash-card__progress-label">
      <span>${progress >= 100 ? '✓ Completed' : 'In Progress'}</span>
      <span>${progress}%</span>
    </div>` : '';

  return `
    <article class="dash-card">
      <div class="dash-card__image">
        <span class="dash-card__badge${badgeModifier}">
          ${course.levelLabel}
        </span>
      </div>
      <div class="dash-card__content">
        <div class="dash-card__category">${course.categoryLabel}</div>
        <h3 class="dash-card__title">
          <a href="course-detail.html?id=${course.id}"
             class="dash-card__link">
            ${course.title}
          </a>
        </h3>
        <div class="dash-card__meta">
          <span class="dash-card__instructor">${course.instructor}</span>
          <span>·</span>
          <span>${course.duration}</span>
          <span>·</span>
          <span class="dash-card__rating">★ ${course.rating}</span>
        </div>
        ${progressHTML}
      </div>
    </article>`;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: renderSavedCourses()

   Renders the saved courses grid or the empty state.

   CONDITIONAL RENDERING LOGIC:
   - savedCourses.length === 0 → show empty state with CTA
   - savedCourses.length  >  0 → show grid of .dash-card elements

   The empty state is already in the HTML as the default.
   We only need to replace it when real cards exist.
   If savedCourses is empty we leave the HTML as-is — the default
   empty state from Milestone 1 is already correct.

   @param {Object[]} savedCourses - Array of matched course objects
═══════════════════════════════════════════════════════════════ */
function renderSavedCourses(savedCourses) {
  const grid  = document.querySelector('[data-field="saved-courses-grid"]');
  const count = document.querySelector('[data-field="saved-count"]');
  if (!grid) return;

  // Update the count label in the section header
  if (count) {
    const label = savedCourses.length === 1 ? 'course' : 'courses';
    count.textContent = `${savedCourses.length} ${label}`;
  }

  // If nothing is saved, the default empty state HTML is already correct.
  // No need to overwrite it.
  if (savedCourses.length === 0) return;

  // Build and inject the course cards
  grid.innerHTML = `
    <div class="dashboard-courses">
      ${savedCourses.map(course => buildDashCard(course)).join('')}
    </div>`;
}


/* ═══════════════════════════════════════════════════════════════
   MAIN FUNCTION: loadDashboard()

   Orchestrates all dashboard data loading and rendering.

   ORDER OF OPERATIONS:
   1. Read user data from localStorage (synchronous — instant)
   2. Render welcome section and stats immediately (no wait)
   3. Fetch courses.json (async — slight delay)
   4. Match saved IDs to course objects
   5. Render saved courses grid

   WHY STEPS 1–2 HAPPEN BEFORE THE FETCH:
   The welcome section and stats only need localStorage data —
   no network request required. Rendering them immediately means
   the user sees personalised content instantly, before the JSON
   finishes loading. The grid skeleton state persists during the
   brief fetch, then gets replaced. This is the same progressive
   enhancement pattern used by LinkedIn's dashboard.
═══════════════════════════════════════════════════════════════ */
/**
 * renderEnrolledCourses
 *
 * Renders enrolled courses into [data-field="enrolled-courses-grid"].
 * Reuses buildDashCard() — identical card template to saved courses.
 *
 * @param {Object[]} enrolledCourses - Matched course objects
 */
function renderEnrolledCourses(enrolledCourses) {
  const grid  = document.querySelector('[data-field="enrolled-courses-grid"]');
  const count = document.querySelector('[data-field="enrolled-count"]');

  if (count) {
    const label = enrolledCourses.length === 1 ? 'course' : 'courses';
    count.textContent = `${enrolledCourses.length} ${label}`;
  }

  if (!grid || enrolledCourses.length === 0) return;

  // Read the progress object — { "course-id": percentage, ... }
  // Defaults to {} so courses with no recorded progress show 0%
  const progressMap = JSON.parse(
    localStorage.getItem('sf_course_progress') || '{}'
  );

  grid.innerHTML = `
    <div class="dashboard-courses">
      ${enrolledCourses.map(course => {
        // Get progress for this course, default to 0 if not yet started
        const progress = progressMap[course.id] ?? 0;
        return buildDashCard(course, progress);
      }).join('')}
    </div>`;
}


/**
 * getRecommendations
 *
 * Pure function — takes all courses and saved IDs, returns the
 * top 3 recommended courses the user hasn't saved yet.
 *
 * ALGORITHM:
 * 1. Filter out courses the user has already saved
 * 2. Sort remaining courses by rating (highest first)
 * 3. Take the first 3 with slice()
 *
 * WHY PURE:
 * No DOM access, no localStorage reads, no side effects.
 * Takes data in, returns data out. This makes it trivially
 * replaceable with a real API call later — just swap what
 * populates the variable, renderRecommendations() is unchanged.
 *
 * WHY slice(0, 3):
 * slice() never throws if fewer than 3 items exist.
 * A user with 10 saved courses gets 2 recommendations.
 * A user with 12 saved courses gets an empty array → empty state.
 *
 * @param  {Object[]} allCourses - All 12 course objects
 * @param  {string[]} savedIds   - IDs of already-saved courses
 * @returns {Object[]}           - Up to 3 recommended courses
 */
function getRecommendations(allCourses, savedIds) {
  return allCourses
    .filter(course => !savedIds.includes(course.id)) // exclude saved
    .sort((a, b) => b.rating - a.rating)             // highest rated first
    .slice(0, 3);                                    // take top 3
}


/**
 * renderRecommendations
 *
 * Renders the recommended courses grid or an empty state.
 * Reuses buildDashCard() — no duplicate template code.
 *
 * WHY REUSE buildDashCard():
 * Recommended courses and saved courses look identical on the
 * dashboard — same compact card, same layout, same link behaviour.
 * One template serves both sections. If the card design changes,
 * it changes in one place.
 *
 * @param {Object[]} recommendations - Up to 3 course objects
 */
function renderRecommendations(recommendations) {
  const grid = document.querySelector('[data-field="recommended-grid"]');
  if (!grid) return;

  // If no unsaved courses remain (user saved everything), show
  // a congratulatory message rather than a generic empty state.
  if (recommendations.length === 0) {
    grid.innerHTML = `
      <div class="dashboard-empty">
        <div class="dashboard-empty__icon">🎉</div>
        <h3 class="dashboard-empty__title">You've saved everything!</h3>
        <p class="dashboard-empty__text">
          You've saved all available courses. Check back soon for new additions.
        </p>
      </div>`;
    return;
  }

  // Render the recommendation cards in a grid — same structure
  // as the saved courses grid for visual consistency.
  grid.innerHTML = `
    <div class="dashboard-courses">
      ${recommendations.map(course => buildDashCard(course)).join('')}
    </div>`;
}


async function loadDashboard() {

  /* ─── STEP 1: Read all user state from localStorage ──────── */

  // User name — default to "Learner" for first-time visitors
  const userName = localStorage.getItem(DB_KEY_USER_NAME) || 'Learner';

  // Course ID arrays — all default to [] if not yet set
  const savedIds    = getStoredArray(DB_KEY_SAVED);
  const enrolledIds = getStoredArray(DB_KEY_ENROLLED);
  const completedIds = getStoredArray(DB_KEY_COMPLETED);


  /* ─── STEP 2: Render welcome + stats immediately ─────────── */

  // Time-based greeting
  fill('time-greeting', getTimeGreeting());

  // User name — appears in both the heading and the sidebar
  fill('user-name',         userName);
  fill('sidebar-user-name', userName);

  // Stats counters
  fill('stat-saved',     savedIds.length);
  fill('stat-enrolled',  enrolledIds.length);
  fill('stat-completed', completedIds.length);

  // Sidebar summary text
  const savedLabel    = savedIds.length    === 1 ? 'course' : 'courses';
  const enrolledLabel = enrolledIds.length === 1 ? 'course' : 'courses';
  fill('sidebar-saved',    `${savedIds.length} ${savedLabel} saved`);
  fill('sidebar-enrolled', `${enrolledIds.length} ${enrolledLabel} enrolled`);


  /* ─── STEP 3: Fetch courses.json ─────────────────────────── */

  // If nothing is saved we still fetch — recommendations need
  // the full course list even when the saved grid is empty.
  // The saved grid will show the default empty state from Milestone 1.

  let allCourses;

  try {
    const response = await fetch('../data/courses.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    allCourses = await response.json();

  } catch (error) {
    console.error('Dashboard: failed to load courses.json', error);
    // Fetch failed — show a minimal error message in the saved grid.
    const grid = document.querySelector('[data-field="saved-courses-grid"]');
    if (grid) {
      grid.innerHTML = `
        <div class="dashboard-empty">
          <div class="dashboard-empty__icon">⚠️</div>
          <h3 class="dashboard-empty__title">Could not load course data</h3>
          <p class="dashboard-empty__text">
            Please open this page using Live Server in VS Code.
          </p>
        </div>`;
    }
    return;
  }


  /* ─── STEP 4: Match saved IDs to course objects ──────────── */

  // Array.filter() keeps only courses whose id is in savedIds.
  // Array.includes() checks each id against the saved array.
  // The order follows savedIds so the grid reflects save order.
  const savedCourses = savedIds
    .map(id => allCourses.find(c => c.id === id))
    .filter(Boolean); // remove any undefined (e.g. deleted course)


  /* ─── STEP 5: Render the saved courses grid ──────────────── */

  renderSavedCourses(savedCourses);


  /* ─── STEP 6: Render enrolled courses ────────────────────── */

  const enrolledCourses = enrolledIds
    .map(id => allCourses.find(c => c.id === id))
    .filter(Boolean);

  renderEnrolledCourses(enrolledCourses);


  /* ─── STEP 7: Calculate and render recommendations ────────── */

  // getRecommendations is a pure function — no DOM access.
  // It filters out saved courses, sorts by rating, takes top 3.
  const recommendations = getRecommendations(allCourses, savedIds);

  // renderRecommendations handles both the populated and empty cases.
  renderRecommendations(recommendations);
}


/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT

   defer in the <script> tag guarantees all data-field elements
   exist before this runs. No DOMContentLoaded needed.
═══════════════════════════════════════════════════════════════ */
loadDashboard();


/* ═══════════════════════════════════════════════════════════════
   CROSS-TAB SYNC — storage event

   The 'storage' event fires in OTHER open tabs when localStorage
   changes. It does NOT fire in the tab that made the change.

   WHY THIS MATTERS:
   If the user has the dashboard open in Tab A and updates their
   name on the profile page in Tab B, without this listener the
   dashboard would show the old name until Tab A is manually
   refreshed. With this listener it updates instantly.

   HOW IT WORKS:
   event.key    → which localStorage key changed
   event.newValue → the new value (null if key was removed)
   event.oldValue → the previous value

   WHAT WE SYNC:
   - sf_user_name       → update welcome greeting and name
   - sf_saved_courses   → update saved count stats
   - sf_enrolled_courses  → update enrolled stat
   - sf_completed_courses → update completed stat
═══════════════════════════════════════════════════════════════ */
window.addEventListener('storage', (event) => {

  // Only respond to keys in our sf_ namespace
  if (!event.key || !event.key.startsWith('sf_')) return;

  switch (event.key) {

    case 'sf_user_name': {
      // Name changed in another tab — update welcome and sidebar
      const newName = event.newValue || 'Learner';
      fill('user-name',         newName);
      fill('sidebar-user-name', newName);
      fill('time-greeting',     getTimeGreeting());
      break;
    }

    case 'sf_saved_courses': {
      // Wishlist changed in another tab — update stats
      const saved = JSON.parse(event.newValue || '[]');
      fill('stat-saved',    saved.length);
      fill('sidebar-saved', `${saved.length} ${saved.length === 1 ? 'course' : 'courses'} saved`);
      break;
    }

    case 'sf_enrolled_courses': {
      const enrolled = JSON.parse(event.newValue || '[]');
      fill('stat-enrolled',    enrolled.length);
      fill('sidebar-enrolled', `${enrolled.length} ${enrolled.length === 1 ? 'course' : 'courses'} enrolled`);
      break;
    }

    case 'sf_completed_courses': {
      const completed = JSON.parse(event.newValue || '[]');
      fill('stat-completed', completed.length);
      break;
    }

    case 'sf_course_progress': {
      // Progress updated in another tab — re-render enrolled cards
      // so the progress bars reflect the new values immediately.
      // We re-use the same enrolled IDs already in storage.
      const enrolledIds = JSON.parse(
        localStorage.getItem('sf_enrolled_courses') || '[]'
      );
      if (enrolledIds.length === 0) break;

      fetch('../data/courses.json')
        .then(r => r.json())
        .then(allCourses => {
          const enrolledCourses = enrolledIds
            .map(id => allCourses.find(c => c.id === id))
            .filter(Boolean);
          renderEnrolledCourses(enrolledCourses);
        })
        .catch(() => {}); // silent — dashboard still functional if fetch fails
      break;
    }

  }
});
