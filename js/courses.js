/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — COURSES PAGE JAVASCRIPT

   Handles all interactive behaviour on the courses catalog page:
   - Category filter buttons
   - Results counter updates
   - Search functionality (Week 3 Day 3)
   - Empty state display

   ARCHITECTURE:
   - No global variables (everything is scoped)
   - DOM selections happen once at the top
   - Event listeners are attached after DOM is ready
   - Pure functions where possible (easier to debug)

   DEPENDENCIES:
   - pages/courses.html (DOM structure)
   - css/components/empty-state.css (empty state styles)

   LAST UPDATED: Week 3, Day 1
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
const courseCards = document.querySelectorAll('.course-card');

// The results count paragraph (shows "Showing X courses")
const resultsCount = document.querySelector('.courses-catalog__count');

// The search input field
const searchInput = document.querySelector('#course-search');


/* ═══════════════════════════════════════════════════════════════
   SECTION 2: STATE

   "State" means the current condition of the UI.
   We track which filter is active so we can reference it later.

   WHY: When a user clicks a filter, we need to know which
   category is currently selected. Storing it in a variable
   lets us check it from any function.
═══════════════════════════════════════════════════════════════ */

// The currently active filter category
// 'all' means no filter applied — show everything
let activeFilter = 'all';

// The current search term typed by the user
// Empty string means no search is active
let activeSearch = '';


/* ═══════════════════════════════════════════════════════════════
   SECTION 3: FUNCTIONS

   Functions are reusable blocks of code. Each function has
   one job — this makes them easy to understand and debug.
═══════════════════════════════════════════════════════════════ */

/**
 * updateResultsCount
 *
 * Counts the currently visible course cards and updates
 * the results counter text in the UI.
 *
 * WHY: After filtering, the counter should reflect how many
 * courses are actually visible, not the total of 12.
 */
function updateResultsCount() {
  // Count cards that are not hidden
  // Array.from converts NodeList to Array so we can use .filter()
  const visibleCards = Array.from(courseCards).filter(card => {
    // Cards we hide get a 'hidden' class — count the ones without it
    return !card.classList.contains('course-card--hidden');
  });

  const count = visibleCards.length;

  // Build the label — "1 course" vs "12 courses" (correct grammar)
  const label = count === 1 ? 'course' : 'courses';

  // Update the counter text in the DOM
  resultsCount.innerHTML = `Showing <strong>${count} ${label}</strong>`;
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


/* ═══════════════════════════════════════════════════════════════
   SECTION 4: EVENT LISTENERS

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
  });

});


// Search input event listener
// 'input' fires after every value change: typing, paste, autocomplete
if (searchInput) {
  searchInput.addEventListener('input', () => {

    // Read and store the current search term
    activeSearch = searchInput.value;

    // Re-run the combined filter+search with the current category
    // This means search always works WITHIN the active category
    filterCourses(activeFilter, activeSearch);

  });
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 5: INITIALISATION

   Code that runs once when the page first loads.
   Sets the initial state of the UI.
═══════════════════════════════════════════════════════════════ */

// Set the initial results count when the page loads
// (before any filtering or searching has happened)
updateResultsCount();
