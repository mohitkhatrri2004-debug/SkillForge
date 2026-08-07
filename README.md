# SkillForge — Student Learning Platform

A production-quality frontend learning platform built with HTML5, CSS3, and JavaScript. Developed incrementally following professional frontend engineering practices including component architecture, BEM, design tokens, accessibility, and responsive design.

---

## Live Demo

Open `index.html` via [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code.

> Note: JavaScript features (course filtering, search, dynamic pages) require Live Server due to the `fetch()` API. Opening files directly via `file://` will not work for these features.

---

## Project Status

| Week | Focus | Status |
|------|-------|--------|
| Week 1 | Foundation, Homepage, Design System | ✅ Complete |
| Week 2 | Courses Module, Course Detail Pages, UI States | ✅ Complete |
| Week 3 | JavaScript Interactivity, Dynamic Content | ✅ Complete |
| Week 4 | Dashboard, Profile, Multi-page Features | 🔄 Day 2 Complete |
| Week 5+ | Advanced Features, Backend Integration | Planned |

---

## What's Built

### Week 1 — Foundation & Homepage

- CSS architecture based on ITCSS principles
- Design token system (colors, typography, spacing, shadows, radii)
- CSS reset and base typography
- Responsive navbar with active state management
- Hero section with gradient background, statistics, and entrance animations
- Features section with 6-card grid and hover effects
- Footer with multi-column layout and social links
- Mobile-first responsive layout across all breakpoints

### Week 2 — Courses Module

**Courses Catalog Page**
- 12 course cards across 5 categories (Programming, Design, Data Science, Business, Marketing)
- Category filter bar with active state
- Search input field
- Results counter component
- Responsive 1 → 2 → 3 column grid

**Course Detail Pages**
- Breadcrumb navigation
- Course hero with level badges (Beginner / Intermediate / Advanced)
- Learning objectives grid
- Expandable curriculum accordion using native `<details>` / `<summary>`
- Student reviews section
- Sticky sidebar with course info card and instructor card
- Three complete static detail pages (Web Development, UI/UX Design, Machine Learning)

**Loading & Empty States**
- Skeleton loader component with GPU-accelerated shimmer animation
- `prefers-reduced-motion` support
- Empty state component with 5 variants (no results, no filter, error, compact, inline)
- Full accessibility compliance (ARIA roles, live regions)
- Demo pages for both components

### Week 3 — JavaScript Interactivity (In Progress)

**Day 1 — Course Filtering & Live Search**
- Category filter buttons with active state toggling
- `data-filter` attributes on buttons, `data-category` on cards
- Live search across course title, category, and instructor name
- Combined filter + search logic (search works within active category)
- Dynamic results counter updates
- Empty state rendered by JavaScript when no results match
- "Browse All Courses" reset button

**Day 2 — URL Parameters & Dynamic Course Pages**
- `data/courses.json` with all 12 courses (full data including curriculum, reviews, instructor bio)
- `pages/course-detail.html` — single template page for all courses
- `js/course-detail.js` — reads `?id=` URL parameter, fetches JSON, fills template
- All 12 course cards link to `course-detail.html?id=course-slug`
- Dynamic breadcrumb, level badge (with correct CSS modifier), instructor initials
- Error state for invalid or missing course IDs
- `async/await` with `try/catch` error handling

**Day 3 — Dynamic Card Rendering from JSON**
- Course cards rendered entirely from `courses.json` via JavaScript
- `buildCardHTML(course)` — pure function, one JSON object → one card HTML string
- `loadCourses()` — async function fetches JSON, renders all 12 cards, removes skeletons
- `setLoadingState(isLoading)` — disables filter buttons and search during fetch, re-enables after
- Skeleton cards replace hardcoded HTML as the initial loading state
- Single `innerHTML` write for atomic skeleton → cards swap (no flicker)
- `courseCards` NodeList re-queried after render so filter and search work on dynamic elements
- Error state shown if `fetch()` fails (e.g. opened without Live Server)
- All existing filter, search, and empty state behaviour preserved without changes

**Day 5 — Sorting, Counter Enhancement & Card Animations**
- Sort dropdown with 5 options (Default, Highest Rated, Most Students, Shortest, Longest)
- `parseDuration("48 hours")` → `48` — numeric extraction for correct duration sort
- `sortCourses()` — sorts a `[...allCourses]` copy, never mutates the original JSON order
- `allCourses` cache variable preserves original JSON order so "Default" always works
- Student enrollment count (`👥 312,456`) added to every course card footer
- "Most Students" sort uses `course.students` field (distinct from `ratingCount`)
- Results counter enhanced: "Showing 12 courses" → "Showing 4 of 12 courses" when filtered
- Card entrance animation (`@keyframes card-enter`) — 200ms fade + 12px rise on load and sort
- `prefers-reduced-motion` disables animation for users with vestibular sensitivity
- Sort selection persists to `localStorage` via `saveUIState()` / `restoreUIState()`
- Sort dropdown disabled during fetch, re-enabled after cards render

**Day 6 — Debounced Search, Clear Button & Scroll Polish**
- Search input debounced with `setTimeout` / `clearTimeout` — 250ms delay prevents excessive calls
- `searchTimer` variable holds the pending timer ID so each keystroke cancels the previous one
- Search clear button (`×`) appears inside the input when text is present, hidden when empty
- HTML `hidden` attribute used for accessible visibility toggle — removes button from tab order when invisible
- Clear button click: clears input, cancels debounce timer, runs `filterCourses()` immediately, returns focus to input
- Clear button restored on page reload when a saved search exists (via `restoreUIState()`)
- `scrollToGrid()` — scrolls viewport to the courses catalog after sort change using `scrollIntoView()`
- `scroll-margin-top` CSS property compensates for sticky navbar height (no hardcoded pixel values)
- `window.matchMedia('prefers-reduced-motion')` check — passes `'instant'` behaviour for sensitive users
- Scroll triggered only on sort change, not on filter or search interactions

### Week 4 — Dashboard & Multi-page State

**Day 1 — Dashboard Page**
- `pages/dashboard.html` — full personalised dashboard with welcome section, stats, saved courses, recommendations, sidebar
- `css/pages/dashboard.css` — dashboard-specific styles: welcome band, stat cards, two-column grid with named template areas, compact dash cards, empty states
- `js/dashboard.js` — reads localStorage, fetches `courses.json`, renders dynamic content
- `getTimeGreeting()` — time-based greeting (morning / afternoon / evening)
- `getStoredArray(key)` — safe localStorage read helper, always returns `[]` for missing keys
- `buildDashCard(course)` — compact card template for dashboard (different from catalog card)
- `renderSavedCourses(savedCourses)` — renders saved courses grid or empty state
- `getRecommendations(allCourses, savedIds)` — pure function, filters saved, sorts by rating, returns top 3
- `renderRecommendations(courses)` — renders recommendations reusing `buildDashCard()`
- Stats row shows saved / enrolled / completed counts from localStorage
- Recommended section shows 3 highest-rated unsaved courses, never duplicates saved courses
- Dashboard link added to navbar on all pages
- `initSaveButton()` in `course-detail.js` — Save for Later button wired on detail pages

**Day 2 — Profile Page, Form Validation & Cross-Tab Sync**
- `pages/profile.html` — full profile page with avatar, stats, display name form, danger zone
- `css/pages/profile.css` — profile-specific styles: form inputs, error/success feedback, danger zone (GitHub-style red border)
- `js/profile.js` — complete profile page logic
- `loadProfile()` — reads all user state from localStorage, fills avatar initials, name, stats, pre-fills form
- `getInitials(name)` — derives 1–2 initials ("Mohit Khatri" → "MK", "Mohit" → "MO")
- `initNameForm()` — form `submit` listener with `event.preventDefault()`, validates length, saves to localStorage, shows feedback
- `showFormError()` — three-signal error: red border, inline text, `role="alert"` screen reader announcement
- `showFeedback()` — success/error message with 4-second auto-hide for successes
- `clearFormError()` — clears error state on every keystroke so errors disappear as user corrects them
- `initDangerZone()` — "Clear Wishlist" (`removeItem`) and "Reset All Data" (all `sf_` keys), both gated with `window.confirm()`
- `👤 Profile` link added to navbar on all pages
- `window.addEventListener('storage')` in `dashboard.js` — cross-tab sync: name and stats update live when another tab changes localStorage
- `window.addEventListener('storage')` in `courses.js` — save button states sync across tabs when wishlist changes

---

## File Structure

```
SkillForge/
├── index.html                        Homepage
│
├── pages/
│   ├── courses.html                  Course catalog (12 cards, filter, search, sort)
│   ├── course-detail.html            Dynamic course detail template
│   ├── dashboard.html                Personalised user dashboard
│   ├── profile.html                  User profile and settings page
│   ├── course-web-development.html   Static detail page (legacy)
│   ├── course-ui-ux-design.html      Static detail page (legacy)
│   ├── course-machine-learning.html  Static detail page (legacy)
│   ├── skeleton-demo.html            Skeleton loader demo
│   └── empty-state-demo.html         Empty state demo
│
├── css/
│   ├── main.css                      CSS entry point (imports all layers)
│   ├── base/
│   │   ├── variables.css             Design tokens
│   │   ├── reset.css                 Browser normalisation
│   │   └── typography.css            Base text styles
│   ├── components/
│   │   ├── navbar.css
│   │   ├── footer.css
│   │   ├── skeleton.css              Loading state component
│   │   └── empty-state.css           Empty state component
│   └── pages/
│       ├── home.css
│       ├── courses.css               Catalog styles + JS-controlled states
│       ├── course-detail.css         Detail page styles
│       ├── dashboard.css             Dashboard page styles
│       └── profile.css               Profile and settings page styles
│
├── js/
│   ├── courses.js                    Filter, search, sort, empty state, wishlist
│   ├── course-detail.js              URL params, fetch, DOM rendering, save button
│   ├── dashboard.js                  localStorage reads, course rendering, recommendations
│   └── profile.js                    Form validation, name save, danger zone, cross-tab sync
│
├── data/
│   └── courses.json                  All 12 courses with full structured data
│
├── assets/                           Images and media (planned)
├── .gitignore
└── README.md
```

---

## Architecture

### CSS — ITCSS-inspired Layers

```
Layer 1  variables.css    Design tokens — single source of truth for all values
Layer 2  reset.css        Browser normalisation
Layer 3  typography.css   Base HTML element styles
Layer 4  components/      Reusable UI components
Layer 5  pages/           Page-specific styles
```

### Design Token System

All visual values are defined as CSS custom properties in `variables.css`:

- **Colors:** Brand blues, neutral grays, status colors (green, yellow, red)
- **Typography:** Font scale (xs → 5xl), weights, line heights, letter spacing
- **Spacing:** 4px base unit scale (space-1 through space-24)
- **Shadows:** Four-level elevation system (sm, md, lg, xl)
- **Radii:** Consistent border radius scale
- **Animation:** Timing durations and easing functions
- **Z-index:** Named scale (base, raised, dropdown, sticky, overlay, modal, toast)

### BEM Naming Convention

```css
.course-card               Block
.course-card__title        Element
.course-card__badge--advanced  Modifier
```

### JavaScript Architecture

- DOM selections performed once at the top of each file
- State tracked in module-level variables (`activeFilter`, `activeSearch`, `activeSort`)
- Pure helper functions with single responsibilities
- `async/await` for all asynchronous operations
- `try/catch` on all `fetch()` calls
- Guard clauses (`if (!el) return`) prevent null reference errors
- `js-*` prefixed classes used as JS-only identifiers (never styled)
- `sf_` prefixed `localStorage` keys prevent clashes with other scripts
- Event delegation for dynamically rendered elements (one listener per container)
- `JSON.stringify` / `JSON.parse` for persisting arrays to `localStorage`
- Debounced input handlers (`setTimeout` / `clearTimeout`) for performance
- `window.matchMedia('prefers-reduced-motion')` checked before triggering animations

---

## Accessibility

WCAG 2.1 Level AA compliant throughout:

- Semantic HTML5 landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Correct heading hierarchy on every page (h1 → h2 → h3)
- `aria-label` and `aria-labelledby` on all navigations and sections
- `aria-current="page"` on active navigation links
- `aria-pressed` on filter toggle buttons
- `aria-live="polite"` on dynamically updated regions
- `role="status"` for non-urgent updates, `role="alert"` for errors
- `aria-hidden="true"` on decorative skeleton loaders
- Visible focus indicators via `:focus-visible`
- `prefers-reduced-motion` support on all animations
- Keyboard navigation tested on all interactive elements
- Touch targets minimum 44×44px on mobile

---

## Responsive Design

Mobile-first approach with three primary breakpoints:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, stacked navigation |
| Tablet | 640px – 1023px | Two-column grids |
| Desktop | 1024px+ | Three-column grids, sticky sidebar |

---

## Performance

- GPU-accelerated animations using `transform` and `opacity`
- `will-change: transform` on animated skeleton elements
- CSS-only skeleton shimmer (no JavaScript)
- `defer` on all script tags (no render blocking)
- Google Fonts loaded with `preconnect`
- Single CSS entry point via `@import` cascade

---

## Getting Started

**Prerequisites:** VS Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) installed.

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/SkillForge.git

# Open in VS Code
code SkillForge

# Right-click index.html in the Explorer panel
# Select "Open with Live Server"
```

Navigate to `http://127.0.0.1:5500` in your browser.

---

## Roadmap

### Week 3 (Complete ✅)
- [x] Category filtering with JavaScript
- [x] Live search
- [x] Dynamic empty states
- [x] URL parameters and JSON data
- [x] Dynamic course detail pages
- [x] Dynamic card rendering from JSON
- [x] Loading state management (disabled controls during fetch)
- [x] localStorage — persist active filter across reloads
- [x] localStorage — persist search term across reloads
- [x] localStorage — course wishlist (save/unsave with ♡/♥)
- [x] Sort dropdown (Highest Rated, Most Students, Shortest, Longest, Default)
- [x] Student enrollment count on course cards
- [x] Results counter — "Showing X of Y courses" format
- [x] Card entrance animation with reduced-motion support
- [x] Debounced search input (250ms delay, setTimeout/clearTimeout)
- [x] Search clear button (×) with accessible visibility toggle
- [x] Smooth scroll to catalog on sort change (scrollIntoView + scroll-margin-top)

### Week 4 (In Progress)
- [x] Dashboard page with welcome section, stats, saved courses, recommendations
- [x] `localStorage` multi-page state sharing (courses → dashboard)
- [x] Recommendation algorithm (filter saved, sort by rating, top 3)
- [x] Save for Later button wired up on course detail pages
- [x] Dashboard link added to all page navbars
- [x] Profile page with display name form and validation
- [x] Avatar initials computed from display name
- [x] Danger zone — Clear Wishlist and Reset All Data
- [x] Cross-tab sync via `window.addEventListener('storage')`
- [x] `👤 Profile` link in navbar across all pages
- [ ] Enroll button with localStorage tracking
- [ ] Progress indicators

---

## Author

**Mohit Khatri**
B.Tech CSE (IoT)
Passionate about frontend development, clean architecture, and building real-world projects.

---

## License

This project is created for educational and learning purposes.
