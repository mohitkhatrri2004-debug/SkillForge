/* ═══════════════════════════════════════════════════════════════
   SKILLFORGE — PAGE TRANSITIONS

   Uses the View Transitions API (Chrome 111+) to animate between
   pages with a smooth cross-fade. Falls back gracefully to normal
   navigation on unsupported browsers — the CSS page-enter
   animation in main.css still plays on every page load.

   PROGRESSIVE ENHANCEMENT:
   - Supported (Chrome 111+): smooth cross-fade between pages
   - Unsupported:             normal navigation + CSS fade-in

   HOW IT WORKS:
   1. Intercept clicks on internal <a> links
   2. Call document.startViewTransition() — browser captures
      the current page as a screenshot
   3. Navigate to the new URL inside the callback
   4. Browser animates from the old screenshot to the new page

   WHY closest('a[href]'):
   The clicked element may be a <span> or <svg> inside a link.
   closest() walks up the DOM to find the containing <a>.

   WHY skip external and special links:
   - External URLs (different origin) should open normally
   - #hash links scroll the current page, no transition needed
   - mailto:/tel: links are not page navigations
   - Links with target="_blank" open in a new tab

   LAST UPDATED: Week 5, Day 1
═══════════════════════════════════════════════════════════════ */

// Only run if the View Transitions API is available.
// No-op on unsupported browsers — CSS fade-in still works.
if (document.startViewTransition) {

  document.addEventListener('click', (event) => {

    // Walk up from the clicked element to find an <a> tag
    const link = event.target.closest('a[href]');

    // Ignore if no link was clicked
    if (!link) return;

    const href = link.href;

    // Skip external links (different hostname)
    if (link.hostname !== window.location.hostname) return;

    // Skip hash-only links (same-page anchor scrolling)
    if (link.hash && link.pathname === window.location.pathname) return;

    // Skip mailto: and tel: links
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // Skip links that open in a new tab
    if (link.target === '_blank') return;

    // Skip if modifier keys are held (Ctrl+click, Cmd+click, etc.)
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;

    // Prevent the default hard navigation
    event.preventDefault();

    // Start the transition — browser captures the current page,
    // then navigates to the new URL inside the callback
    document.startViewTransition(() => {
      window.location.href = href;
    });

  });

}
