/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — COURSE DETAIL PAGE JAVASCRIPT

   Reads the course ID from the URL, fetches course data from
   courses.json, and fills the course-detail.html template.

   FLOW:
   1. Read ?id= parameter from the URL
   2. Fetch data/courses.json
   3. Find the course whose id matches the URL parameter
   4. Fill every data-field element with the correct content
   5. If no match is found, show an error state

   ARCHITECTURE:
   - One async function orchestrates the whole flow
   - Pure helper functions handle each rendering concern
   - No global variables
   - All DOM writes go through a single fill() helper

   DEPENDENCIES:
   - pages/course-detail.html  (data-field targets)
   - data/courses.json         (course data source)

   LAST UPDATED: Week 3, Day 2
═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   HELPER: fill()

   Sets the textContent of a [data-field] element.
   Central function for all simple text updates.

   WHY A HELPER:
   Every DOM update follows the same pattern:
   1. Find the element by data-field value
   2. Set its text
   Having one helper keeps the main function readable and means
   if we ever need to change how we update fields, we change it
   in one place.

   @param {string} fieldName  - The data-field attribute value
   @param {string} value      - The text to set
═══════════════════════════════════════════════════════════════ */

/* ─── API Configuration ─────────────────────────────────────── */
// Environment-aware: localhost → dev server on :3000, deployed → same-origin /api
const API_BASE = (() => {
  const { hostname } = window.location;
  const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
  return isDev ? 'http://localhost:3000/api' : '/api';
})();


function fill(fieldName, value) {
  const el = document.querySelector(`[data-field="${fieldName}"]`);

  // Guard: if the element doesn't exist, skip silently
  // This prevents errors if a field is accidentally missing from HTML
  if (!el) return;

  el.textContent = value;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: getInitials()

   Derives two-letter initials from a full name.
   Used for the instructor avatar circle.

   Examples:
   "Dr. Angela Yu"          → "AY"
   "Maximilian Schwarzmüller" → "MS"
   "Andrew Ng"              → "AN"

   HOW IT WORKS:
   1. Split name into words
   2. Filter out short words like "Dr." "Mr." "Prof."
   3. Take the first letter of the first two meaningful words

   @param  {string} name  - Full name string
   @returns {string}      - Two uppercase initials
═══════════════════════════════════════════════════════════════ */
function getInitials(name) {
  const words = name
    .split(' ')
    // Filter out titles shorter than 3 characters (Dr., Mr., etc.)
    .filter(word => word.replace('.', '').length >= 2);

  // Take first letter of first two words
  const initials = words
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  return initials || '??';
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: buildStars()

   Generates an accessible star rating string.

   WHY:
   Courses have numeric ratings like 4.8 or 5.0.
   The template shows ★★★★★ visually with an aria-label for
   screen readers. We build both from the numeric value.

   @param  {number} rating  - Numeric rating e.g. 4.8
   @returns {string}        - "★★★★★" (always 5 stars visually,
                              the number communicates exact rating)
═══════════════════════════════════════════════════════════════ */
function buildStars(rating) {
  const el = document.querySelector('[data-field="stars"]');
  if (!el) return;

  el.textContent  = '★★★★★';
  el.setAttribute('aria-label', `${rating} out of 5 stars`);
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: setLevelBadge()

   Sets both the text and the CSS modifier class on the level
   badge so it gets the correct colour (green/yellow/red).

   The modifier classes come from course-detail.css:
   .course-hero__level--beginner     → green
   .course-hero__level--intermediate → yellow
   .course-hero__level--advanced     → red

   @param {string} level       - "beginner" | "intermediate" | "advanced"
   @param {string} levelLabel  - "Beginner" | "Intermediate" | "Advanced"
═══════════════════════════════════════════════════════════════ */
function setLevelBadge(level, levelLabel) {
  const el = document.querySelector('[data-field="level-badge"]');
  if (!el) return;

  el.textContent = levelLabel;

  // Remove any previously set modifier class first
  el.classList.remove(
    'course-hero__level--beginner',
    'course-hero__level--intermediate',
    'course-hero__level--advanced'
  );

  // Add the correct modifier for this course's level
  el.classList.add(`course-hero__level--${level}`);
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: renderObjectives()

   Builds the "What You'll Learn" checklist from the objectives
   array in the JSON.

   Each objective becomes an <li> with the .learning-objectives__item
   class, matching the structure in the existing static pages.

   @param {string[]} objectives  - Array of objective strings
═══════════════════════════════════════════════════════════════ */
function renderObjectives(objectives) {
  const ul = document.querySelector('[data-field="objectives"]');
  if (!ul) return;

  // Build all <li> elements as a single HTML string
  // Template literals make this clean and readable
  ul.innerHTML = objectives
    .map(obj => `<li class="learning-objectives__item">${obj}</li>`)
    .join('');
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: renderLongDescription()

   Splits the longDescription string on double newlines and
   wraps each paragraph in a <p> tag.

   WHY:
   JSON doesn't support HTML tags, so multi-paragraph text is
   stored as a plain string. We convert it to proper paragraphs.

   @param {string} text  - Plain text, paragraphs separated by \n\n
═══════════════════════════════════════════════════════════════ */
function renderLongDescription(text) {
  const container = document.querySelector('[data-field="long-description"]');
  if (!container) return;

  // Split on double newline, filter empty strings, wrap each in <p>
  const paragraphs = text
    .split('\n\n')
    .filter(p => p.trim() !== '')
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  // If no double newlines, treat the whole text as one paragraph
  container.innerHTML = paragraphs || `<p>${text}</p>`;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: renderCurriculum()

   Builds the expandable curriculum accordion from the curriculum
   array in the JSON.

   Each module becomes a <details>/<summary> block matching the
   exact structure used in the existing static course pages.

   @param {Object[]} curriculum  - Array of module objects from JSON
     Each module: { title, duration, lessons: [{ title, duration }] }
═══════════════════════════════════════════════════════════════ */
function renderCurriculum(curriculum) {
  const container = document.querySelector('[data-field="curriculum"]');
  if (!container) return;

  const modulesHTML = curriculum.map((module, index) => {
    // Build the lessons list for this module
    const lessonsHTML = module.lessons
      .map(lesson => `
        <li class="curriculum__lesson">
          <span class="curriculum__lesson-title">${lesson.title}</span>
          <span class="curriculum__lesson-duration">${lesson.duration}</span>
        </li>`)
      .join('');

    // First module is open by default (matches existing page behaviour)
    const openAttr = index === 0 ? ' open' : '';

    return `
      <details class="curriculum__module"${openAttr}>
        <summary class="curriculum__module-header">
          <h3 class="curriculum__module-title">
            <span class="curriculum__module-number">${index + 1}.</span>
            ${module.title}
          </h3>
          <span class="curriculum__module-meta">
            ${module.lessons.length} lessons · ${module.duration}
          </span>
        </summary>
        <ol class="curriculum__lessons">
          ${lessonsHTML}
        </ol>
      </details>`;
  }).join('');

  container.innerHTML = modulesHTML;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: renderReviews()

   Builds student review cards from the reviews array in JSON.
   Matches the .review structure in existing static pages exactly.

   @param {Object[]} reviews  - Array of review objects from JSON
     Each review: { name, initials, date, dateLabel, rating, text }
═══════════════════════════════════════════════════════════════ */
function renderReviews(reviews) {
  const container = document.querySelector('[data-field="reviews"]');
  if (!container) return;

  const reviewsHTML = reviews.map(review => {
    // Build star string for aria-label
    const starLabel = `${review.rating} out of 5 stars`;

    return `
      <div class="review">
        <div class="review__header">
          <div class="review__author">
            <div class="review__author-avatar">${review.initials}</div>
            <div class="review__author-info">
              <h3 class="review__author-name">${review.name}</h3>
              <time class="review__date" datetime="${review.date}">
                ${review.dateLabel}
              </time>
            </div>
          </div>
          <div class="review__rating">
            <span class="review__stars" aria-label="${starLabel}">★★★★★</span>
          </div>
        </div>
        <p class="review__text">${review.text}</p>
      </div>`;
  }).join('');

  container.innerHTML = reviewsHTML;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: showErrorState()

   Replaces the main content with a helpful error message when
   no course is found for the given ID.

   This handles two cases:
   1. Invalid ID in URL (user typed a wrong URL)
   2. fetch() failed (no server / network error when using file://)

   @param {string} message  - Description of what went wrong
═══════════════════════════════════════════════════════════════ */
function showErrorState(message) {
  const main = document.querySelector('#main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="empty-state" role="alert" style="margin: var(--space-20) auto; max-width: 600px;">
      <div class="empty-state__icon">⚠️</div>
      <div class="empty-state__content">
        <h1 class="empty-state__title">Course Not Found</h1>
        <p class="empty-state__description">${message}</p>
      </div>
      <div class="empty-state__actions">
        <a href="courses.html" class="empty-state__button">Browse All Courses</a>
      </div>
    </div>`;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: initProgressControl()

   Shows the progress control widget only when the user is enrolled.
   Reads current progress from sf_course_progress, sets the active
   button and fill width, then writes back on every button click.

   STORAGE STRUCTURE:
   sf_course_progress = { "react-complete-guide": 75, ... }
   An object keyed by course ID — fast lookup, easy partial update.

   @param {string} courseId - e.g. "react-complete-guide"
═══════════════════════════════════════════════════════════════ */
function initProgressControl(courseId) {
  const ENROLLED_KEY = 'sf_enrolled_courses';
  const PROGRESS_KEY = 'sf_course_progress';

  // Only show the control if the user is enrolled
  const enrolled = JSON.parse(localStorage.getItem(ENROLLED_KEY) || '[]');
  if (!enrolled.includes(courseId)) return;

  const control = document.getElementById('progress-control');
  const fill    = document.getElementById('progress-fill');
  const track   = document.getElementById('progress-track');
  const buttons = document.querySelectorAll('.progress-control__btn');

  if (!control || !fill || !track || !buttons.length) return;

  // Read current progress for this course (0 if not started)
  function getProgress() {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return map[courseId] ?? 0;
  }

  // Write updated progress to localStorage.
  // Also manages sf_completed_courses:
  // - progress === 100 → add courseId to completed array
  // - progress  <  100 → remove courseId from completed array
  function saveProgress(value) {
    // Update the progress map
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    map[courseId] = value;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));

    // Sync the completed courses array
    const COMPLETED_KEY = 'sf_completed_courses';
    const completed = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');

    if (value >= 100 && !completed.includes(courseId)) {
      // Mark as complete
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed, courseId]));
    } else if (value < 100 && completed.includes(courseId)) {
      // Un-mark as complete (user moved progress back below 100)
      localStorage.setItem(COMPLETED_KEY,
        JSON.stringify(completed.filter(id => id !== courseId))
      );
    }
  }

  // Update the visual bar and button states
  function updateUI(value) {
    // Update the fill bar width
    fill.style.width = `${value}%`;

    // Toggle green colour at 100%
    fill.classList.toggle('progress-control__fill--complete', value >= 100);

    // Update aria attributes for screen readers
    track.setAttribute('aria-valuenow', value);

    // Highlight only the active button
    buttons.forEach(btn => {
      const isActive = Number(btn.dataset.progress) === value;
      btn.classList.toggle('progress-control__btn--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  // Show the control (remove hidden attribute)
  control.hidden = false;

  // Set the initial state from localStorage
  updateUI(getProgress());

  // Wire up button clicks
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = Number(btn.dataset.progress);
      saveProgress(value);
      updateUI(value);
    });
  });
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: initEnrollButton()

   Wires up the "Enroll Now" buttons on the course detail page.
   There are two: the hero button and the sidebar CTA.
   Both are wired to the same logic — clicking either one enrolls
   or unenrolls the course.

   STORAGE KEY: sf_enrolled_courses (same key dashboard.js reads)
   
   BEHAVIOUR:
   - On load: reads localStorage, sets correct button state
   - First click:  enroll  — button shows "✓ Enrolled"
   - Second click: unenroll — button reverts to "Enroll Now — Free"

   WHY TWO BUTTONS:
   Both the hero and the sidebar CTA should stay in sync.
   A user scrolling past the hero should be able to enroll from
   the sidebar without the state being inconsistent.

   @param {string} courseId    - e.g. "react-complete-guide"
   @param {string} courseTitle - used in aria-label
═══════════════════════════════════════════════════════════════ */
function initEnrollButton(courseId, courseTitle) {
  // Select both enroll buttons — hero and sidebar CTA
  const heroBtn    = document.querySelector('.course-hero__enroll-btn');
  const sidebarBtn = document.querySelector('.course-info-card__cta');

  if (!heroBtn && !sidebarBtn) return;

  const STORAGE_KEY = 'sf_enrolled_courses';

  function getEnrolled() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function setEnrolled(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // Update both buttons to reflect the current enrolled state
  function updateButtons(isEnrolled) {
    const btns = [heroBtn, sidebarBtn].filter(Boolean);

    btns.forEach(btn => {
      if (isEnrolled) {
        btn.textContent = '✓ Enrolled';
        btn.setAttribute('aria-label', `You are enrolled in ${courseTitle}. Click to unenroll.`);
        btn.classList.add('course-hero__enroll-btn--enrolled');
      } else {
        btn.textContent = 'Enroll Now — Free';
        btn.setAttribute('aria-label', `Enroll in ${courseTitle}`);
        btn.classList.remove('course-hero__enroll-btn--enrolled');
      }
    });
  }

  // Set the correct initial state from localStorage
  updateButtons(getEnrolled().includes(courseId));

  // Toggle on click — same handler attached to both buttons
  function handleClick() {
    const enrolled  = getEnrolled();
    const isEnrolled = enrolled.includes(courseId);

    const updated = isEnrolled
      ? enrolled.filter(id => id !== courseId)   // unenroll
      : [...enrolled, courseId];                  // enroll

    setEnrolled(updated);
    updateButtons(!isEnrolled);
  }

  if (heroBtn)    heroBtn.addEventListener('click', handleClick);
  if (sidebarBtn) sidebarBtn.addEventListener('click', handleClick);
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: initSaveButton()

   Wires up the "Save for Later" wishlist button on the course
   hero. Reads and writes the same sf_saved_courses key used by
   courses.js — one source of truth across the whole app.

   BEHAVIOUR:
   - On load: reads localStorage and sets the correct button state
   - On click: toggles saved/unsaved, updates localStorage,
     updates button text and style immediately

   @param {string} courseId    - e.g. "react-complete-guide"
   @param {string} courseTitle - Used in aria-label for accessibility
═══════════════════════════════════════════════════════════════ */
function initSaveButton(courseId, courseTitle) {
  const btn = document.querySelector('.course-hero__wishlist-btn');
  if (!btn) return;

  const STORAGE_KEY = 'sf_saved_courses';

  // Read the current saved array from localStorage
  function getSaved() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  // Write an updated array back to localStorage
  function setSaved(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // Update button visual state to match current saved status
  function updateButton(isSaved) {
    if (isSaved) {
      btn.textContent = '♥ Saved';
      btn.setAttribute('aria-label', `Remove ${courseTitle} from wishlist`);
      btn.classList.add('course-hero__wishlist-btn--saved');
    } else {
      btn.textContent = '♥ Save for Later';
      btn.setAttribute('aria-label', `Save ${courseTitle} for later`);
      btn.classList.remove('course-hero__wishlist-btn--saved');
    }
  }

  // Set the correct initial state based on localStorage
  const initialSaved = getSaved().includes(courseId);
  updateButton(initialSaved);

  // Toggle on click
  btn.addEventListener('click', () => {
    const saved = getSaved();
    const isSaved = saved.includes(courseId);

    const updated = isSaved
      ? saved.filter(id => id !== courseId)   // remove
      : [...saved, courseId];                  // add

    setSaved(updated);
    updateButton(!isSaved);
  });
}


/* ═══════════════════════════════════════════════════════════════
   MAIN FUNCTION: loadCourse()

   Orchestrates the entire page population flow:
   1. Read the course ID from the URL
   2. Fetch and parse courses.json
   3. Find the matching course
   4. Call all render helpers to populate the page

   WHY async/await:
   fetch() is asynchronous — it takes time to load the JSON file.
   async/await lets us write this sequentially (step by step)
   instead of nesting callbacks inside callbacks.

   WHY try/catch:
   If fetch fails (e.g. no server, wrong path), it throws an error.
   try/catch intercepts that error so we can show a helpful message
   instead of crashing silently or showing a broken page.
═══════════════════════════════════════════════════════════════ */
async function loadCourse() {

  /* ─── STEP 1: Read the URL parameter ───────────────────────
     window.location.search is the query string portion of the URL.
     e.g. for  course-detail.html?id=react-complete-guide
     it returns  "?id=react-complete-guide"

     URLSearchParams parses this string into a key/value map.
     params.get('id') returns "react-complete-guide".
  ─────────────────────────────────────────────────────────── */
  const params   = new URLSearchParams(window.location.search);
  const courseId = params.get('id');

  // If there's no ?id= in the URL at all, show error immediately
  if (!courseId) {
    showErrorState('No course was specified. Please return to the course catalog and select a course.');
    return; // Stop — nothing more to do
  }

  /* ─── STEP 2: Fetch the specific course from the API ──────────
     GET /api/courses/:id returns exactly one course object,
     or 404 if not found. This is more efficient than fetching
     all 12 courses and finding the match client-side.
  ─────────────────────────────────────────────────────────── */
  let course;

  try {
    const response = await fetch(`${API_BASE}/courses/${encodeURIComponent(courseId)}`);

    // 404 means valid request but course not found — show friendly message
    if (response.status === 404) {
      showErrorState(
        `No course found with the ID "${courseId}". It may have been removed or the link may be incorrect.`
      );
      return;
    }

    // Any other non-OK status is a server error
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // The API returns the course object directly (not wrapped)
    course = await response.json();

  } catch (error) {
    // fetch() itself threw — server not running
    console.error('Course data fetch failed:', error);
    showErrorState(
      'Course data could not be loaded. Make sure the SkillForge API server is running: cd server && npm run dev'
    );
    return;
  }

  /* ─── STEP 4: Populate the page ─────────────────────────────
     Now we have the course object. We call each helper to fill
     in its section. The order here follows the page from top
     to bottom for readability.
  ─────────────────────────────────────────────────────────── */

  // --- Browser tab and SEO ---
  document.title = `${course.title} — SkillForge`;

  const metaDesc = document.querySelector('[data-field="meta-description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${course.title} - ${course.description}`);
  }

  // --- Breadcrumb ---
  const breadcrumbCat = document.querySelector('[data-field="breadcrumb-category"]');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = course.categoryLabel;
    breadcrumbCat.href = `courses.html?category=${course.category}`;
  }
  fill('breadcrumb-title', course.title);

  // --- Hero badges ---
  fill('category-label', course.categoryLabel);
  setLevelBadge(course.level, course.levelLabel);

  // --- Hero text ---
  fill('title', course.title);
  fill('description', course.description);

  // --- Hero meta ---
  buildStars(course.rating);
  fill('rating',       course.rating);
  fill('rating-count', `(${course.ratingCount} ratings)`);
  fill('students',     `${course.students} students enrolled`);
  fill('duration',     `${course.duration} total`);
  fill('updated-date', `Updated ${course.updatedDate}`);

  // --- Instructor (hero) ---
  fill('instructor-name', course.instructor);

  // --- Main content sections ---
  renderObjectives(course.objectives);
  renderLongDescription(course.longDescription);
  renderCurriculum(course.curriculum);
  renderReviews(course.reviews);

  // --- Sidebar ---
  fill('sidebar-duration', course.duration);

  // --- Instructor card ---
  fill('instructor-initials',  getInitials(course.instructor));
  fill('instructor-name-card', course.instructor);
  fill('instructor-title',     course.instructorTitle);
  fill('instructor-rating',    course.instructorRating);
  fill('instructor-students',  course.instructorStudents);
  fill('instructor-courses',   course.instructorCourses);
  fill('instructor-bio',       course.instructorBio);

  // --- Save for Later button ---
  initSaveButton(course.id, course.title);

  // --- Enroll Now button ---
  initEnrollButton(course.id, course.title);

  // --- Progress control ---
  initProgressControl(course.id);

  // --- Tab navigation ---
  initTabs();
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: initTabs()

   Wires click and keyboard navigation for the course content tabs.

   ARIA PATTERN:
   - Tabs are role="tab" buttons inside a role="tablist"
   - Each tab has aria-controls pointing to its panel's id
   - Active tab: aria-selected="true" + .course-tabs__tab--active
   - Panels use the HTML `hidden` attribute — removed to show

   KEYBOARD NAVIGATION (WCAG 2.1 keyboard pattern for tabs):
   - Arrow Left / Arrow Right: move focus between tabs
   - Home / End: jump to first / last tab
   - Enter / Space: handled automatically (button elements)
═══════════════════════════════════════════════════════════════ */
function initTabs() {
  const tabs   = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  if (!tabs.length || !panels.length) return;

  function activateTab(tab) {
    // Deactivate all tabs and hide all panels
    tabs.forEach(t => {
      t.classList.remove('course-tabs__tab--active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach(p => { p.hidden = true; });

    // Activate the selected tab and show its panel
    tab.classList.add('course-tabs__tab--active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = false;
  }

  // Click listener on each tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  // Keyboard navigation — arrow keys move between tabs
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      let next;

      if (e.key === 'ArrowRight') {
        next = tabs[index + 1] || tabs[0];           // wrap around
      } else if (e.key === 'ArrowLeft') {
        next = tabs[index - 1] || tabs[tabs.length - 1]; // wrap around
      } else if (e.key === 'Home') {
        next = tabs[0];
      } else if (e.key === 'End') {
        next = tabs[tabs.length - 1];
      }

      if (next) {
        e.preventDefault();
        activateTab(next);
      }
    });
  });

  // Set correct tabindex on load — only the active tab is in tab order
  tabs.forEach(tab => {
    tab.setAttribute('tabindex',
      tab.getAttribute('aria-selected') === 'true' ? '0' : '-1'
    );
  });
}


/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT

   Call loadCourse() when the script runs.
   Because the <script> tag uses defer, the full DOM is already
   available at this point — no need for DOMContentLoaded.
═══════════════════════════════════════════════════════════════ */
loadCourse();
