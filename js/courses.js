/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — COURSES PAGE JAVASCRIPT

   Handles all interactive behaviour on the courses catalog page:
   - Category filter buttons
   - Results counter updates
   - Live search
   - Empty state display
   - localStorage persistence (filter + search)

   ARCHITECTURE:
   - No global variables (everything is scoped)
   - DOM selections happen once at the top
   - Event listeners are attached after DOM is ready
   - Pure functions where possible (easier to debug)

   DEPENDENCIES:
   - pages/courses.html (DOM structure)
   - css/components/empty-state.css (empty state styles)

   LAST UPDATED: Week 3, Day 4
═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   SECTION 1: DOM SELECTIONS

   We select all the HTML elements we need ONCE at the top.

   WHY: Selecting elements is a relatively slow operation.
   Doing it once and storing the result in a variable is
   faster than selecting the same element multiple times.

   Think of it like looking up a word in a dictionary.
   You find the page once, put your finger on it,
   and refer back to it — you don't flip through the
   dictionary every time you want to re-read the definition.
═══════════════════════════════════════════════════════════════ */

// All category filter buttons in the filter bar
const filterButtons = document.querySelectorAll('.filters__category');

// The courses grid container
const coursesGrid = document.querySelector('.courses-grid');

// All individual course card elements
// let (not const) because loadCourses() reassigns this after
// rendering — const cannot be reassigned.
let courseCards = document.querySelectorAll('.course-card');

// The results count paragraph (shows "Showing X courses")
const resultsCount = document.querySelector('.courses-catalog__count');

// The search input field
const searchInput = document.querySelector('#course-search');

// The search clear (×) button
const searchClear = document.querySelector('.filters__search-clear');

// The sort dropdown
const sortSelect = document.querySelector('#course-sort');


/* ═══════════════════════════════════════════════════════════════
   SECTION 2: STORAGE KEYS & STATE

   localStorage keys are prefixed with 'sf_' (SkillForge) to
   avoid accidental clashes with browser extensions or other
   scripts running on the same origin.

   WHY CONSTANTS FOR KEYS:
   Using a constant means the key string is written once.
   If you ever rename a key, you change one line — not every
   place it's used. A typo in the string would silently fail
   (reads would return null). Constants catch typos at a glance.
═══════════════════════════════════════════════════════════════ */

// localStorage key for the active category filter
const STORAGE_KEY_FILTER = 'sf_active_filter';

// localStorage key for the active search term
const STORAGE_KEY_SEARCH = 'sf_active_search';

// localStorage key for the array of saved course IDs
const STORAGE_KEY_SAVED  = 'sf_saved_courses';

// localStorage key for the active sort selection
const STORAGE_KEY_SORT   = 'sf_active_sort';

// The currently active filter category.
// On first load, check localStorage for a saved value.
// Fall back to 'all' if nothing is stored yet.
let activeFilter = localStorage.getItem(STORAGE_KEY_FILTER) || 'all';

// The current search term typed by the user.
// On first load, check localStorage for a saved value.
// Fall back to empty string if nothing is stored yet.
let activeSearch = localStorage.getItem(STORAGE_KEY_SEARCH) || '';

// The currently active sort selection.
// On first load, check localStorage for a saved value.
// Fall back to 'default' (original JSON order).
let activeSort = localStorage.getItem(STORAGE_KEY_SORT) || 'default';

// The full courses array as fetched from JSON — never mutated.
// Stored here so sortCourses() can always sort from the original order.
let allCourses = [];

// Timer ID for the debounced search.
// Stored outside the event listener so clearTimeout() can cancel
// the previous timer before scheduling a new one.
let searchTimer = null;


/* ═══════════════════════════════════════════════════════════════
   SECTION 3: FUNCTIONS

   Functions are reusable blocks of code. Each function has
   one job — this makes them easy to understand and debug.
═══════════════════════════════════════════════════════════════ */

/**
 * updateResultsCount
 *
 * Counts visible and total course cards, then updates the
 * results counter text.
 *
 * FORMAT:
 * - All cards visible  → "Showing 12 courses"
 * - Some hidden        → "Showing 4 of 12 courses"
 *
 * WHY "X of Y":
 * When a filter or search is active, showing only the visible
 * count leaves users wondering if something is broken. "4 of 12"
 * immediately communicates a subset is showing — industry standard
 * used by Udemy, Airbnb, Amazon product listings.
 *
 * WHY courseCards.length FOR TOTAL:
 * Hidden cards still exist in the NodeList — they have
 * display:none but are not removed from the DOM. So .length
 * always reflects all 12 rendered cards regardless of visibility.
 */
function updateResultsCount() {
  // Total cards rendered (hidden + visible)
  const total = courseCards.length;

  // Visible cards — those without the hidden modifier class
  const visibleCards = Array.from(courseCards).filter(
    card => !card.classList.contains('course-card--hidden')
  );
  const visible = visibleCards.length;

  // "1 course" vs "4 courses" — correct grammar
  const label = visible === 1 ? 'course' : 'courses';

  // Show "X of Y" only when a filter/search is active (visible < total)
  const text = visible === total
    ? `Showing <strong>${visible} ${label}</strong>`
    : `Showing <strong>${visible} of ${total} ${label}</strong>`;

  resultsCount.innerHTML = text;
}


/**
 * getCardSearchText
 *
 * Extracts all searchable text from a course card into one
 * lowercase string. This is the text we'll search against.
 *
 * @param  {HTMLElement} card - A course card article element
 * @returns {string}          - One lowercase string of all text
 *
 * WHY A HELPER FUNCTION:
 * We need to extract text from multiple elements inside each card.
 * Putting this logic in its own function keeps filterCourses clean
 * and makes it easy to add more searchable fields later.
 *
 * WHAT WE SEARCH:
 * - Course title     (.course-card__link)
 * - Category label   (.course-card__category)
 * - Instructor name  (.course-card__instructor)
 *
 * Searching all three means "angela" matches Dr. Angela Yu's course,
 * "design" matches both Design courses and UI/UX course titles.
 */
function getCardSearchText(card) {
  const title      = card.querySelector('.course-card__link')?.textContent       || '';
  const category   = card.querySelector('.course-card__category')?.textContent   || '';
  const instructor = card.querySelector('.course-card__instructor')?.textContent || '';

  // Combine everything into one searchable string, all lowercase
  // The || '' fallback prevents errors if an element is missing
  return `${title} ${category} ${instructor}`.toLowerCase();
}


/**
 * filterCourses
 *
 * The single source of truth for which cards are visible.
 * Applies BOTH the active category filter AND the active search
 * term simultaneously, so they always work together.
 *
 * WHY COMBINE BOTH HERE:
 * Keeping filter and search in one function means we never get
 * into an inconsistent state. Whether the user clicks a filter
 * button or types in the search box, this one function decides
 * what's visible. One function, one responsibility: visibility.
 *
 * @param {string} category - Category to filter by, or 'all'
 * @param {string} search   - Search term to match against, or ''
 */
function filterCourses(category, search) {
  // Normalise the search term: lowercase + trim whitespace
  // .trim() removes leading/trailing spaces e.g. " react " → "react"
  const term = search.toLowerCase().trim();

  // Always remove any existing empty state before re-evaluating
  removeEmptyState();

  // Loop through every course card and decide its visibility
  courseCards.forEach(card => {
    const cardCategory = card.dataset.category;

    // RULE 1 — Category match
    // Card passes if: filter is 'all', OR card's category matches
    const categoryMatch = category === 'all' || cardCategory === category;

    // RULE 2 — Search match
    // Card passes if: search is empty, OR card text contains the term
    // getCardSearchText returns lowercase, term is also lowercase
    const searchMatch = term === '' || getCardSearchText(card).includes(term);

    // Card is only visible if it passes BOTH rules
    const shouldShow = categoryMatch && searchMatch;

    if (shouldShow) {
      card.classList.remove('course-card--hidden');
    } else {
      card.classList.add('course-card--hidden');
    }
  });

  // Update the counter to reflect new visible count
  updateResultsCount();

  // Show empty state if no cards passed both rules
  const visibleCards = Array.from(courseCards).filter(
    card => !card.classList.contains('course-card--hidden')
  );

  if (visibleCards.length === 0) {
    // Decide on the empty state message context:
    // If searching, mention the search term; otherwise mention category
    const emptyContext = term !== '' ? `"${term}"` : category;
    showEmptyState(emptyContext);
  }
}


/**
 * showEmptyState
 *
 * Creates and inserts an empty state message into the courses grid
 * when no course cards match the active filter.
 *
 * @param {string} category - The category label shown in the message
 *                            e.g. "Programming", "Design"
 *
 * HOW IT WORKS:
 * 1. We create a new <div> element in JavaScript memory
 * 2. We give it the empty-state CSS classes we built in Week 2
 * 3. We set its inner HTML with a helpful message
 * 4. We append it to the courses grid so it appears on screen
 *
 * WHY APPEND TO THE GRID:
 * The empty state sits inside the same grid container as the
 * course cards. This keeps it visually in the right place and
 * makes it easy to remove when cards are shown again.
 */
function showEmptyState(context) {
  // Determine if context is a search term (has quotes) or a category slug
  const isSearchTerm = context.startsWith('"');

  // Build a friendly display name for category slugs
  // e.g. 'data-science' → 'Data Science'
  // For search terms we use as-is (already has quotes)
  const displayName = isSearchTerm
    ? context
    : context
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

  // Choose the right message based on context
  const title = isSearchTerm
    ? `No results for ${displayName}`
    : `No ${displayName} courses yet`;

  const description = isSearchTerm
    ? `Try a different search term or browse all courses.`
    : `We're working on adding more ${displayName} courses. Try another category or browse all courses.`;

  // Create the empty state container element
  const emptyState = document.createElement('div');

  // Add the BEM class and a JS-specific identifier class
  // The js-empty-state class lets us find and remove it later
  emptyState.className = 'empty-state empty-state--inline js-empty-state';

  // Set the accessible role so screen readers announce it
  emptyState.setAttribute('role', 'status');
  emptyState.setAttribute('aria-live', 'polite');

  // Build the inner HTML using our existing empty-state component
  emptyState.innerHTML = `
    <div class="empty-state__icon">🎯</div>
    <div class="empty-state__content">
      <h3 class="empty-state__title">${title}</h3>
      <p class="empty-state__description">${description}</p>
    </div>
    <div class="empty-state__actions">
      <button class="empty-state__button js-clear-filter">
        Browse All Courses
      </button>
    </div>
  `;

  // Insert the empty state at the end of the courses grid
  coursesGrid.appendChild(emptyState);

  // Attach a click listener to the "Browse All Courses" button
  // This resets the filter back to 'all' without a page reload
  const clearButton = emptyState.querySelector('.js-clear-filter');
  clearButton.addEventListener('click', () => {
    // Find the "All Courses" button and simulate a click on it
    // This reuses our existing filter logic cleanly
    const allButton = document.querySelector('[data-filter="all"]');
    allButton.click();
  });
}


/**
 * removeEmptyState
 *
 * Removes the empty state from the grid if it exists.
 * Called before every filter operation to reset the state.
 *
 * WHY: We always clean up before inserting a new empty state.
 * This prevents duplicate empty states from building up.
 */
function removeEmptyState() {
  // Look for an existing empty state in the grid
  const existing = coursesGrid.querySelector('.js-empty-state');

  // Only remove it if one actually exists
  // (If we call remove() on null, JavaScript throws an error)
  if (existing) {
    existing.remove();
  }
}


/**
 * setActiveFilter
 *
 * Updates which filter button appears as "active" (highlighted).
 *
 * @param {HTMLElement} clickedButton - The button that was clicked.
 *
 * HOW IT WORKS:
 * We remove the active class from ALL buttons first (reset),
 * then add it only to the clicked button. This ensures only
 * one button is ever active at a time.
 */
function setActiveFilter(clickedButton) {
  // Remove active state from all buttons first
  filterButtons.forEach(button => {
    button.classList.remove('filters__category--active');
    button.setAttribute('aria-pressed', 'false');
  });

  // Add active state to the clicked button only
  clickedButton.classList.add('filters__category--active');
  clickedButton.setAttribute('aria-pressed', 'true');
}


/**
 * getSavedCourses
 *
 * Reads the saved courses array from localStorage.
 * Always returns a real array — never null or undefined.
 *
 * WHY JSON.parse + fallback:
 * localStorage stores strings only. JSON.parse converts the
 * stored string back to an array. The '[]' fallback handles
 * the first-time case where nothing has been saved yet —
 * localStorage.getItem returns null, so null || '[]' gives '[]',
 * which JSON.parse converts to an empty array.
 *
 * @returns {string[]} Array of saved course ID strings
 */
function getSavedCourses() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]');
}


/**
 * toggleSavedCourse
 *
 * Adds or removes a course ID from the saved courses array,
 * persists the change to localStorage, and updates the button
 * visual state on the corresponding card.
 *
 * @param {string} courseId - The course ID (e.g. 'react-complete-guide')
 */
function toggleSavedCourse(courseId) {
  const saved = getSavedCourses();

  let updatedSaved;

  if (saved.includes(courseId)) {
    // Course is already saved — remove it (unsave)
    // Array.filter returns a new array without the matching item.
    // We never mutate the original — this keeps the logic predictable.
    updatedSaved = saved.filter(id => id !== courseId);
  } else {
    // Course is not saved — add it
    // Spread into a new array to avoid mutating the original.
    updatedSaved = [...saved, courseId];
  }

  // Persist the updated array. JSON.stringify converts the array
  // to a string that localStorage can store.
  localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(updatedSaved));

  // Update this card's button visual state immediately
  updateSaveButton(courseId, updatedSaved.includes(courseId));
}


/**
 * updateSaveButton
 *
 * Applies or removes the saved CSS modifier on a single save button
 * and updates its aria-label to reflect the current state.
 *
 * WHY aria-label UPDATE:
 * Screen readers announce the button by its label. "Save React Guide"
 * and "Unsave React Guide" communicate the action about to happen,
 * not the current state — this is the standard accessible pattern
 * (same as "Follow / Unfollow" on Twitter, "Like / Unlike" on YouTube).
 *
 * @param {string}  courseId - The course ID to find the button for
 * @param {boolean} isSaved  - Whether the course is now saved
 */
function updateSaveButton(courseId, isSaved) {
  // Select the specific button by its data-course-id attribute
  const btn = coursesGrid.querySelector(
    `[data-course-id="${courseId}"]`
  );

  if (!btn) return; // card may be hidden by filter — safe to skip

  if (isSaved) {
    btn.classList.add('course-card__save-btn--saved');
    btn.setAttribute('aria-label',
      btn.getAttribute('aria-label').replace('Save ', 'Unsave ')
    );
    btn.textContent = '♥';              // filled heart when saved
  } else {
    btn.classList.remove('course-card__save-btn--saved');
    btn.setAttribute('aria-label',
      btn.getAttribute('aria-label').replace('Unsave ', 'Save ')
    );
    btn.textContent = '♡';              // outline heart when not saved
  }
}


/**
 * updateAllSaveButtons
 *
 * Reads the saved courses array and applies the correct visual
 * state to every save button currently in the DOM.
 *
 * Called once inside loadCourses() after cards are rendered,
 * so saved courses from a previous session are reflected
 * immediately on page load.
 */
function updateAllSaveButtons() {
  const saved = getSavedCourses();

  // Loop through every save button and set its state
  coursesGrid.querySelectorAll('.course-card__save-btn').forEach(btn => {
    const courseId = btn.dataset.courseId;
    const isSaved  = saved.includes(courseId);
    updateSaveButton(courseId, isSaved);
  });
}


/**
 * parseDuration
 *
 * Extracts the numeric hour value from a duration string.
 * e.g. "48 hours" → 48,  "28 hours" → 28
 *
 * WHY NOT SORT STRINGS DIRECTLY:
 * Strings sort lexicographically. "9 hours" would sort AFTER
 * "60 hours" because "9" > "6" character by character.
 * Parsing to a number first gives correct numeric ordering.
 *
 * @param  {string} durationStr - e.g. "48 hours"
 * @returns {number}            - The numeric part, e.g. 48
 */
function parseDuration(durationStr) {
  // parseInt reads left-to-right and stops at first non-digit.
  // "48 hours" → 48.  The radix 10 prevents octal interpretation.
  return parseInt(durationStr, 10) || 0;
}


/**
 * sortCourses
 *
 * Returns a sorted copy of the allCourses array based on the
 * current activeSort value, then re-renders the grid.
 *
 * WHY A COPY ([...allCourses]):
 * Array.sort() mutates the original array. If we sorted allCourses
 * directly, switching back to "Default" would be impossible because
 * the original order would be permanently lost. Spreading into a
 * new array keeps allCourses unchanged as the source of truth.
 *
 * WHY RE-RENDER THE WHOLE GRID:
 * Sorting requires the cards to appear in a completely new order.
 * The simplest and most reliable way to achieve this is to rebuild
 * the grid HTML from the sorted array — the same pattern loadCourses
 * already uses. One innerHTML write, zero DOM-order edge cases.
 */
function sortCourses() {
  // Work on a shallow copy — never mutate allCourses
  const sorted = [...allCourses];

  switch (activeSort) {
    case 'rating-desc':
      // Higher rating first. b - a gives descending order.
      sorted.sort((a, b) => b.rating - a.rating);
      break;

    case 'students-desc':
      // Higher student count first.
      // Students are stored as formatted strings like "210,456".
      // Remove commas before parsing so parseInt works correctly.
      sorted.sort((a, b) => {
        const countA = parseInt(a.students.replace(/,/g, ''), 10) || 0;
        const countB = parseInt(b.students.replace(/,/g, ''), 10) || 0;
        return countB - countA;
      });
      break;

    case 'duration-asc':
      // Shorter courses first (ascending hours).
      sorted.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
      break;

    case 'duration-desc':
      // Longer courses first (descending hours).
      sorted.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
      break;

    default:
      // 'default' — no sort needed, sorted is already a copy of
      // allCourses which preserves the original JSON order.
      break;
  }

  // Rebuild the grid with sorted cards (same pattern as loadCourses)
  coursesGrid.innerHTML = sorted
    .map(course => buildCardHTML(course))
    .join('');

  // Re-query courseCards so filter/search see the new card order
  courseCards = document.querySelectorAll('.course-card');

  // Re-apply the current filter and search to the newly sorted cards
  filterCourses(activeFilter, activeSearch);

  // Restore save button states on the fresh cards
  updateAllSaveButtons();
}


/**
 * scrollToGrid
 *
 * Smoothly scrolls the viewport to the top of the courses catalog
 * section after a sort change, so the user sees the new order from
 * the beginning rather than from wherever they had scrolled to.
 *
 * WHY scrollIntoView() OVER window.scrollTo():
 * scrollIntoView() is element-relative. If the layout shifts, the
 * scroll target still points to the right place. window.scrollTo()
 * uses hardcoded pixel coordinates that break when layout changes.
 *
 * WHY courses-catalog, NOT courses-grid:
 * Scrolling to the catalog section shows the page heading and
 * results counter, giving the user full context of the new state.
 * Scrolling directly to the grid would hide the counter and heading.
 *
 * WHY prefers-reduced-motion CHECK:
 * Smooth scrolling is an animation. Users who set "reduce motion"
 * in their OS accessibility settings should not see it.
 * We check the media query and pass 'instant' for those users.
 */
function scrollToGrid() {
  const catalog = document.querySelector('.courses-catalog');
  if (!catalog) return;

  // Check if the user prefers reduced motion
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  catalog.scrollIntoView({
    behavior: prefersReduced ? 'instant' : 'smooth',
    block: 'start'
  });
}


/**
 * saveUIState
 *
 * Writes the current activeFilter and activeSearch values to
 * localStorage so they survive page reloads.
 *
 * Called every time the filter or search changes.
 *
 * WHY TWO SEPARATE KEYS (not one object):
 * Storing them separately means we can read/update one without
 * touching the other. It also makes the DevTools Application
 * panel easier to read during debugging.
 */
function saveUIState() {
  localStorage.setItem(STORAGE_KEY_FILTER, activeFilter);
  localStorage.setItem(STORAGE_KEY_SEARCH, activeSearch);
  localStorage.setItem(STORAGE_KEY_SORT,   activeSort);
}


/**
 * restoreUIState
 *
 * Reads the saved filter and search values from localStorage
 * and applies them to the UI — both visually and functionally.
 *
 * Called inside loadCourses() AFTER cards are in the DOM,
 * because filterCourses() needs real course cards to loop over.
 *
 * WHAT IT DOES:
 * 1. If a filter was saved, highlight the correct button
 * 2. If a search term was saved, fill the search input
 * 3. Run filterCourses() with both values to show the right cards
 *
 * WHY NOT CALL THIS EARLIER:
 * If called before cards are rendered, courseCards is empty,
 * filterCourses() would show an incorrect empty state.
 */
function restoreUIState() {
  // Only restore if something was actually saved
  const hasFilter = activeFilter !== 'all';
  const hasSearch = activeSearch !== '';

  // Nothing to restore — page is in default state
  if (!hasFilter && !hasSearch) return;

  // Restore the search input value visually
  if (searchInput && hasSearch) {
    searchInput.value = activeSearch;
    // Also show the clear button since the field now has a value
    if (searchClear) searchClear.hidden = false;
  }

  // Restore the active filter button highlight.
  // Find the button whose data-filter matches the saved value.
  if (hasFilter) {
    const savedButton = document.querySelector(
      `[data-filter="${activeFilter}"]`
    );
    if (savedButton) {
      setActiveFilter(savedButton);
    }
  }

  // Apply the filter and search together so the correct cards show.
  // This is the same call the event listeners make — consistent.
  filterCourses(activeFilter, activeSearch);

  // Restore the sort dropdown visual selection.
  // This is purely visual — sortCourses() was already applied when
  // loadCourses() called it before restoreUIState().
  if (sortSelect && activeSort !== 'default') {
    sortSelect.value = activeSort;
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 4: DATA LOADING & RENDERING
═══════════════════════════════════════════════════════════════ */

/**
 * setLoadingState
 *
 * Enables or disables the filter buttons and search input.
 * Called with true at the start of loadCourses() and false
 * when loading completes (or fails).
 *
 * WHY THIS EXISTS:
 * There is a window between page load and JSON arrival where
 * courseCards is empty. If the user clicks a filter or types
 * in the search box during that window, they get zero results
 * and an incorrect empty state.
 *
 * Disabling the controls prevents invalid interactions.
 * Enabling them after data loads guarantees correct behaviour.
 *
 * WHY disabled/aria-disabled:
 * - disabled on <button> prevents clicks and removes it from
 *   tab order — correct for filter buttons.
 * - aria-disabled on <input> communicates the state to screen
 *   readers. Combined with pointer-events:none via CSS class,
 *   it prevents interaction while remaining accessible.
 *
 * @param {boolean} isLoading - true to disable, false to enable
 */
function setLoadingState(isLoading) {
  // Disable/enable each filter button
  filterButtons.forEach(button => {
    button.disabled = isLoading;
  });

  // Disable/enable the search input
  if (searchInput) {
    searchInput.disabled = isLoading;
    searchInput.setAttribute('aria-disabled', String(isLoading));
  }

  // Disable/enable the sort dropdown
  if (sortSelect) {
    sortSelect.disabled = isLoading;
  }
}

/**
 * buildCardHTML
 *
 * Pure function: takes one course object from courses.json and
 * returns the HTML string for one course card.
 *
 * WHY A SEPARATE FUNCTION:
 * Keeping the template in its own function means loadCourses()
 * stays clean and readable. It also makes the card template easy
 * to find, read, and change in one place.
 *
 * WHY A PURE FUNCTION:
 * It reads only from the `course` argument — no side effects,
 * no DOM reads, no state access. Given the same input it always
 * returns the same output. Easy to reason about and test.
 *
 * @param  {Object} course - One course object from courses.json
 * @returns {string}       - HTML string for one course card
 */
function buildCardHTML(course) {
  // Map level slug to the correct BEM modifier class
  // This gives the badge its colour (green / yellow / red)
  const badgeModifier = course.level !== 'beginner'
    ? ` course-card__badge--${course.level}`
    : '';

  return `
    <article class="course-card" data-category="${course.category}">
      <div class="course-card__image">
        <span class="course-card__badge${badgeModifier}">${course.levelLabel}</span>
      </div>
      <div class="course-card__content">
        <div class="course-card__category">${course.categoryLabel}</div>
        <h3 class="course-card__title">
          <a href="course-detail.html?id=${course.id}" class="course-card__link">
            ${course.title}
          </a>
        </h3>
        <p class="course-card__description">${course.description}</p>
        <div class="course-card__meta">
          <span class="course-card__instructor">${course.instructor}</span>
          <span class="course-card__duration">${course.duration}</span>
        </div>
        <div class="course-card__footer">
          <div class="course-card__rating">
            <span class="course-card__stars"
                  aria-label="${course.rating} out of 5 stars">★★★★★</span>
            <span class="course-card__rating-text">
              ${course.rating} (${course.ratingCount})
            </span>
          </div>
          <span class="course-card__students"
                aria-label="${course.students} students enrolled">
            👥 ${course.students}
          </span>
          <button class="course-card__save-btn"
                  data-course-id="${course.id}"
                  aria-label="Save ${course.title}"
                  type="button">
            ♡
          </button>
        </div>
      </div>
    </article>`;
}


/**
 * loadCourses
 *
 * Async function that drives the full data-loading lifecycle:
 *
 * 1. Fetch data/courses.json
 * 2. Build HTML for all 12 cards using buildCardHTML()
 * 3. Replace skeleton cards with real cards (one innerHTML write)
 * 4. Re-query courseCards so filter/search have the real elements
 * 5. Update the results counter
 *
 * If fetch fails (e.g. opened without Live Server), the skeletons
 * stay visible and an error state appears explaining the problem.
 */
async function loadCourses() {
  // Disable controls immediately — courseCards is empty until
  // the JSON arrives. Prevents filter/search running on nothing.
  setLoadingState(true);

  try {
    // Fetch the JSON file.
    // '../data/courses.json' is relative to pages/courses.html —
    // two dots means "go up one directory to the project root".
    const response = await fetch('../data/courses.json');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const courses = await response.json();

    // Cache the original JSON order in allCourses.
    // sortCourses() always spreads from this — never mutates it.
    allCourses = courses;

    // Sort and render cards. sortCourses() re-queries courseCards
    // internally, so we don't need a separate innerHTML write here.
    sortCourses();

    // Set the initial counter now that we know how many courses loaded.
    updateResultsCount();

    // Re-enable controls now that courseCards has real elements.
    // Filter and search are now safe to use.
    setLoadingState(false);

    // Restore any previously saved filter/search from localStorage.
    // Must happen AFTER setLoadingState(false) so the controls are
    // enabled when restoreUIState() visually activates them.
    restoreUIState();

    // Apply the correct saved/unsaved visual state to every save button.
    // Must happen AFTER restoreUIState() so filtered cards are already
    // visible before we try to find their buttons.
    updateAllSaveButtons();

  } catch (error) {
    // fetch() threw — most likely the page was opened via file://
    // rather than Live Server.
    console.error('Failed to load courses:', error);

    // Replace skeletons with a helpful error state.
    coursesGrid.innerHTML = `
      <div class="empty-state" role="alert"
           style="grid-column: 1 / -1;">
        <div class="empty-state__icon">⚠️</div>
        <div class="empty-state__content">
          <h2 class="empty-state__title">Courses could not be loaded</h2>
          <p class="empty-state__description">
            Please open this page using Live Server in VS Code,
            not by double-clicking the file.
          </p>
        </div>
      </div>`;

    // Update counter to 0 so it doesn't show stale "12 courses" text.
    if (resultsCount) {
      resultsCount.innerHTML = 'Showing <strong>0 courses</strong>';
    }

    // Re-enable controls even on error so the user isn't locked out.
    // The error state message guides them on what to do.
    setLoadingState(false);
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 5: EVENT LISTENERS

   Event listeners watch for user interactions and run a
   function when they happen.

   WHY: This is how JavaScript bridges user action to code.
   The browser is always listening. When the user clicks,
   types, or scrolls, it fires an "event". We listen for
   specific events and respond to them.

   SYNTAX:
   element.addEventListener('event-name', functionToRun);
═══════════════════════════════════════════════════════════════ */

// Attach a click listener to each filter button
filterButtons.forEach(button => {

  button.addEventListener('click', () => {
    const selectedCategory = button.dataset.filter;

    // Update state
    activeFilter = selectedCategory;

    // Highlight this button, remove highlight from others
    setActiveFilter(button);

    // Clear the search input when switching categories
    // This prevents confusing combined states
    // e.g. user typed "react", clicked "Design" — clear search
    if (searchInput) {
      searchInput.value = '';
      activeSearch = '';
    }

    // Apply filter (search is now empty, so only category applies)
    filterCourses(activeFilter, activeSearch);

    // Persist the new state so it survives a page reload
    saveUIState();
  });

});


// Search input event listener — debounced
// 'input' fires after every value change: typing, paste, autocomplete.
//
// WHY DEBOUNCE:
// Without debouncing, filterCourses() runs on every single keystroke.
// With 12 local cards this is fine, but on a real API it would fire
// a network request per character. Debouncing delays execution until
// the user stops typing for 250ms — one call instead of many.
//
// HOW IT WORKS:
// 1. User types a character → clearTimeout cancels the previous timer
// 2. setTimeout schedules filterCourses() to run in 250ms
// 3. If the user types again before 250ms, step 1 cancels that timer
// 4. Only when the user pauses does filterCourses() actually run
if (searchInput) {
  searchInput.addEventListener('input', () => {

    // Read the current search term immediately (before the delay)
    // so activeSearch is always in sync with the input value
    activeSearch = searchInput.value;

    // Show the clear button when there is text, hide it when empty.
    // Toggling the HTML `hidden` attribute is the most accessible
    // approach — it also removes the button from the tab order when
    // invisible, so keyboard users never tab to a hidden button.
    if (searchClear) {
      searchClear.hidden = activeSearch === '';
    }

    // Cancel any previously scheduled filterCourses() call
    clearTimeout(searchTimer);

    // Schedule a new call — runs only if no further input arrives
    // within 250ms
    searchTimer = setTimeout(() => {
      filterCourses(activeFilter, activeSearch);
      saveUIState();
    }, 250);

  });
}


// Search clear button click listener
// Clears the input, hides the button, resets results immediately
// (no debounce needed — this is a deliberate action, not typing)
if (searchClear) {
  searchClear.addEventListener('click', () => {

    // Clear the input value and state
    searchInput.value = '';
    activeSearch      = '';

    // Hide the clear button again
    searchClear.hidden = true;

    // Cancel any pending debounce timer — not needed anymore
    clearTimeout(searchTimer);

    // Run filterCourses immediately (no delay — user clicked, not typed)
    filterCourses(activeFilter, activeSearch);
    saveUIState();

    // Return focus to the search input so keyboard users can
    // continue typing without having to re-click the field
    searchInput.focus();

  });
}


// Sort dropdown event listener
// 'change' fires when the user selects a different option.
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    // Read the chosen sort value from the dropdown
    activeSort = sortSelect.value;

    // Re-sort and re-render the grid
    sortCourses();

    // Persist so the chosen sort survives a page reload
    saveUIState();

    // Scroll back to the top of the catalog so the user sees
    // the re-sorted cards from position 1, not from mid-page.
    // Only on sort — not on filter/search which are incremental.
    scrollToGrid();
  });
}


// ── Save button event delegation ────────────────────────────────
// One listener on the grid handles ALL save button clicks.
//
// WHY ON coursesGrid (not document):
// Scoping the listener to the grid means it only fires for
// clicks that originated inside the grid — not the whole page.
// Tighter scope = cleaner, less likely to intercept unrelated clicks.
//
// HOW event.target.closest() works:
// event.target is the exact element clicked (could be the emoji
// inside the button, not the button itself). closest() walks UP
// the DOM from that element and returns the first ancestor that
// matches the selector — or null if none found.
if (coursesGrid) {
  coursesGrid.addEventListener('click', (event) => {

    // Walk up from the clicked element to find a save button.
    // If the click wasn't on a save button, btn is null — we ignore it.
    const btn = event.target.closest('.course-card__save-btn');
    if (!btn) return;

    // Read the course ID from the button's data attribute
    const courseId = btn.dataset.courseId;
    if (!courseId) return;

    // Toggle saved state and update localStorage + button appearance
    toggleSavedCourse(courseId);

  });
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 6: INITIALISATION

   loadCourses() is the entry point. It fetches the data,
   renders the cards, re-queries courseCards, and calls
   updateResultsCount() — so there's nothing else to run here.
═══════════════════════════════════════════════════════════════ */

loadCourses();


/* ═══════════════════════════════════════════════════════════════
   CROSS-TAB SYNC — storage event

   If the user clears their wishlist on the profile page while
   the courses page is open in another tab, the save buttons
   should reflect the change without a manual reload.

   We also respond to a full data reset (sf_saved_courses removed)
   by resetting all save buttons to their default ♡ state.
═══════════════════════════════════════════════════════════════ */
window.addEventListener('storage', (event) => {

  // Only care about wishlist changes
  if (event.key !== 'sf_saved_courses') return;

  // newValue is null when the key was deleted (e.g. Reset All Data)
  const saved = JSON.parse(event.newValue || '[]');

  // Re-apply correct ♡ / ♥ state to every save button in the grid
  coursesGrid.querySelectorAll('.course-card__save-btn').forEach(btn => {
    const courseId = btn.dataset.courseId;
    const isSaved  = saved.includes(courseId);

    if (isSaved) {
      btn.classList.add('course-card__save-btn--saved');
      btn.textContent = '♥';
      btn.setAttribute('aria-label',
        btn.getAttribute('aria-label').replace('Save ', 'Unsave ')
      );
    } else {
      btn.classList.remove('course-card__save-btn--saved');
      btn.textContent = '♡';
      btn.setAttribute('aria-label',
        btn.getAttribute('aria-label').replace('Unsave ', 'Save ')
      );
    }
  });
});
