/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — PROFILE PAGE JAVASCRIPT

   Reads user state from localStorage, populates the profile page,
   handles the display name form with validation, and wires up
   the danger zone (clear wishlist, reset all data).

   FLOW:
   1. Read all user state from localStorage
   2. Populate avatar initials, name, stats immediately
   3. Pre-fill the name input with the saved value
   4. Attach form submit listener with validation
   5. Attach danger zone button listeners

   NEW CONCEPTS IN THIS FILE:
   - form 'submit' event + event.preventDefault()
   - Input validation (length check, trim whitespace)
   - Inline error messages (show/hide with hidden attribute)
   - Success/error feedback with role="alert"
   - localStorage.removeItem() for targeted clearing
   - window.confirm() for destructive action confirmation

   DEPENDENCIES:
   - pages/profile.html  (data-field and id targets)
   - localStorage keys:
       sf_user_name         user's display name
       sf_saved_courses     array of saved course IDs
       sf_enrolled_courses  array of enrolled course IDs
       sf_completed_courses array of completed course IDs

   LAST UPDATED: Week 4, Day 2
═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   STORAGE KEYS — same sf_ namespace as the rest of the project
═══════════════════════════════════════════════════════════════ */

const PROFILE_KEY_NAME      = 'sf_user_name';
const PROFILE_KEY_SAVED     = 'sf_saved_courses';
const PROFILE_KEY_ENROLLED  = 'sf_enrolled_courses';
const PROFILE_KEY_COMPLETED = 'sf_completed_courses';


/* ═══════════════════════════════════════════════════════════════
   HELPER: fill()

   Sets textContent on a [data-field] element.
   Same single-purpose helper pattern used throughout the project.

   @param {string} fieldName  - data-field attribute value
   @param {string|number} value - Text to display
═══════════════════════════════════════════════════════════════ */
function fill(fieldName, value) {
  const el = document.querySelector(`[data-field="${fieldName}"]`);
  if (!el) return;
  el.textContent = value;
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: getStoredArray()

   Safely reads a JSON array from localStorage.
   Returns [] if the key doesn't exist yet.

   @param  {string}   key - localStorage key
   @returns {string[]}    - Array of IDs, or empty array
═══════════════════════════════════════════════════════════════ */
function getStoredArray(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: getInitials()

   Derives up to two initials from a name string.
   "Mohit Khatri" → "MK",  "Mohit" → "MO"

   WHY "MO" for single names:
   Using the first two letters of a single-word name is common
   on platforms like Slack and Notion. "M" alone looks sparse.

   @param  {string} name  - Display name
   @returns {string}      - 1–2 uppercase characters
═══════════════════════════════════════════════════════════════ */
function getInitials(name) {
  const words = name.trim().split(/\s+/);

  if (words.length >= 2) {
    // Multi-word name: first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Single word: first two letters, or just first if only 1 char
  return name.slice(0, 2).toUpperCase();
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: showFeedback()

   Shows the form feedback message with the correct style.
   Automatically hides after 4 seconds for success messages.

   @param {string}  message  - Text to display
   @param {'success'|'error'} type - Controls the CSS modifier
═══════════════════════════════════════════════════════════════ */
function showFeedback(message, type) {
  const feedback = document.getElementById('name-feedback');
  if (!feedback) return;

  // Set the message text and correct modifier class
  feedback.textContent = message;
  feedback.className = `form-feedback form-feedback--${type}`;

  // Remove hidden to make it visible
  feedback.hidden = false;

  // Auto-hide success messages after 4 seconds
  // Error messages stay visible until the user corrects the input
  if (type === 'success') {
    setTimeout(() => {
      feedback.hidden = true;
    }, 4000);
  }
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: clearFormError()

   Hides the inline error text and removes the error CSS class
   from the input. Called at the start of each validation pass
   so stale errors don't persist.
═══════════════════════════════════════════════════════════════ */
function clearFormError() {
  const input = document.getElementById('name-input');
  const error = document.getElementById('name-error');

  if (input) input.classList.remove('form-input--error');
  if (error) { error.textContent = ''; error.hidden = true; }
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: showFormError()

   Shows an inline validation error below the input.
   Also adds the red border CSS class to the input itself.

   WHY THREE SIGNALS (border, text, role="alert"):
   - Red border:    visible to sighted users instantly
   - Error text:    explains what's wrong
   - role="alert":  screen reader announces it without focus move

   @param {string} message - Error description
═══════════════════════════════════════════════════════════════ */
function showFormError(message) {
  const input = document.getElementById('name-input');
  const error = document.getElementById('name-error');

  if (input) input.classList.add('form-input--error');

  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
}


/* ═══════════════════════════════════════════════════════════════
   HELPER: updateAllNameDisplays()

   After saving a new name, updates every element on the page
   that shows the name or initials — header, avatar, etc.

   @param {string} name - The newly saved display name
═══════════════════════════════════════════════════════════════ */
function updateAllNameDisplays(name) {
  fill('profile-name',    name);
  fill('avatar-initials', getInitials(name));
}


/* ═══════════════════════════════════════════════════════════════
   SECTION: LOAD PROFILE

   Reads all user state and populates the page immediately.
   Synchronous — no network request needed, all from localStorage.
═══════════════════════════════════════════════════════════════ */
function loadProfile() {

  // ── Read all state ──────────────────────────────────────────
  const name       = localStorage.getItem(PROFILE_KEY_NAME) || 'Learner';
  const saved      = getStoredArray(PROFILE_KEY_SAVED);
  const enrolled   = getStoredArray(PROFILE_KEY_ENROLLED);
  const completed  = getStoredArray(PROFILE_KEY_COMPLETED);

  // ── Header: avatar initials and display name ────────────────
  fill('avatar-initials',  getInitials(name));
  fill('profile-name',     name);
  fill('header-saved-count', saved.length);

  // ── Stats row ───────────────────────────────────────────────
  fill('stat-saved',     saved.length);
  fill('stat-enrolled',  enrolled.length);
  fill('stat-completed', completed.length);

  // ── About You card ──────────────────────────────────────────
  fill('about-saved',     saved.length);
  fill('about-enrolled',  enrolled.length);
  fill('about-completed', completed.length);

  // ── Pre-fill the name input with current saved value ────────
  // WHY: Users should see their current name in the field,
  // not a blank box. Makes it feel like an edit form, not a
  // first-time setup form.
  const nameInput = document.getElementById('name-input');
  if (nameInput && name !== 'Learner') {
    nameInput.value = name;
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION: FORM VALIDATION & SUBMISSION

   WHY event.preventDefault():
   By default, submitting a <form> causes the browser to reload
   the page (a GET or POST request). preventDefault() stops that
   entirely — we handle everything in JavaScript instead.

   VALIDATION RULES:
   - Must not be empty after trimming whitespace
   - Must be at least 2 characters
   - Must not exceed 50 characters (enforced by maxlength too)
═══════════════════════════════════════════════════════════════ */
function initNameForm() {
  const form  = document.getElementById('name-form');
  const input = document.getElementById('name-input');

  if (!form || !input) return;

  form.addEventListener('submit', (event) => {

    // CRITICAL: Stop the browser from reloading the page
    event.preventDefault();

    // Clear any previous error state before re-validating
    clearFormError();

    // Read and normalise the value
    // .trim() removes leading/trailing spaces
    // "  Mohit  " → "Mohit"
    const value = input.value.trim();

    // ── Validation ──────────────────────────────────────────
    if (value === '') {
      showFormError('Please enter a display name.');
      input.focus();
      return;
    }

    if (value.length < 2) {
      showFormError('Name must be at least 2 characters.');
      input.focus();
      return;
    }

    // Passes validation — save to localStorage
    localStorage.setItem(PROFILE_KEY_NAME, value);

    // Update all name/avatar displays on the page immediately
    updateAllNameDisplays(value);

    // Update the input to show the trimmed version
    input.value = value;

    // Show success feedback
    showFeedback(`✓ Name saved as "${value}"`, 'success');

  });

  // Clear the error state as soon as the user starts typing again.
  // Keeps the form feeling responsive — errors disappear when
  // the user is actively fixing them.
  input.addEventListener('input', () => {
    clearFormError();
    const feedback = document.getElementById('name-feedback');
    if (feedback && feedback.classList.contains('form-feedback--error')) {
      feedback.hidden = true;
    }
  });
}


/* ═══════════════════════════════════════════════════════════════
   SECTION: DANGER ZONE

   Two destructive actions, both gated with window.confirm().

   WHY window.confirm():
   The native browser confirmation dialog cannot be dismissed
   accidentally — the user must make an explicit choice.
   It's the simplest and most accessible confirmation pattern
   for destructive actions on a frontend-only app.
   (Backend apps use custom modal dialogs.)

   WHY localStorage.removeItem() vs localStorage.clear():
   removeItem() removes only ONE key — surgical.
   clear() wipes EVERYTHING — nuclear option reserved for
   "Reset All Data" where the user wants a full wipe.
═══════════════════════════════════════════════════════════════ */
function initDangerZone() {

  // ── Clear Wishlist ──────────────────────────────────────────
  const clearWishlistBtn = document.getElementById('clear-wishlist-btn');

  if (clearWishlistBtn) {
    clearWishlistBtn.addEventListener('click', () => {

      const saved = getStoredArray(PROFILE_KEY_SAVED);

      // If already empty, tell the user — don't show a confirm dialog
      if (saved.length === 0) {
        showFeedback('Your wishlist is already empty.', 'success');
        return;
      }

      // Confirm before destructive action
      const confirmed = window.confirm(
        `This will remove all ${saved.length} saved course(s) from your wishlist.\n\nThis cannot be undone. Continue?`
      );

      if (!confirmed) return;

      // Remove only the saved courses key
      localStorage.removeItem(PROFILE_KEY_SAVED);

      // Update the stats on the page to reflect 0 saved
      fill('stat-saved',         0);
      fill('about-saved',        0);
      fill('header-saved-count', 0);

      showFeedback('✓ Wishlist cleared successfully.', 'success');
    });
  }


  // ── Reset All Data ──────────────────────────────────────────
  const resetAllBtn = document.getElementById('reset-all-btn');

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {

      const confirmed = window.confirm(
        'This will permanently delete:\n\n' +
        '• Your display name\n' +
        '• All saved courses\n' +
        '• All enrolled courses\n' +
        '• All filter and search preferences\n\n' +
        'This cannot be undone. Are you sure?'
      );

      if (!confirmed) return;

      // Remove all sf_ prefixed keys — preserves anything
      // stored by other apps on the same origin
      const keysToRemove = [
        PROFILE_KEY_NAME,
        PROFILE_KEY_SAVED,
        PROFILE_KEY_ENROLLED,
        PROFILE_KEY_COMPLETED,
        'sf_active_filter',
        'sf_active_search',
        'sf_active_sort',
        'sf_auth_token',        // Week 6 Day 4 — auth keys
        'sf_auth_user'
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Reset all displayed values to zero/default
      fill('profile-name',       'Learner');
      fill('avatar-initials',    '?');
      fill('header-saved-count', 0);
      fill('stat-saved',         0);
      fill('stat-enrolled',      0);
      fill('stat-completed',     0);
      fill('about-saved',        0);
      fill('about-enrolled',     0);
      fill('about-completed',    0);

      // Clear the name input field
      const input = document.getElementById('name-input');
      if (input) input.value = '';

      showFeedback('✓ All data has been reset.', 'success');
    });
  }
}


/* ═══════════════════════════════════════════════════════════════
   ENTRY POINT

   All three sections run on page load.
   No async needed — everything reads from localStorage only.
═══════════════════════════════════════════════════════════════ */
loadProfile();
initNameForm();
initDangerZone();
