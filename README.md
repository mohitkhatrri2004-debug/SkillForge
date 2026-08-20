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
| Week 4 | Dashboard, Profile, Multi-page Features | ✅ Complete |
| Week 5 | Polish, Performance & Advanced Features | ✅ Complete |
| Week 6 | Backend Integration (Express API) | ✅ Complete |
| Week 7 | Database & Advanced Backend | 🔄 Day 1 Complete |

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

### Week 5 — Polish & Advanced Features

**Day 1 — Page Transitions**
- `@keyframes page-enter` on `body` in `main.css` — 300ms fade-in on every page load
- `js/transitions.js` — View Transitions API (`document.startViewTransition`) for smooth cross-fade between pages on Chrome 111+
- Progressive enhancement — CSS fade-in always plays, API used when available
- All external links, hash anchors, and modifier-key clicks skipped correctly
- Added to all 10 HTML pages via `defer` script tag

**Day 2 — Course Detail Tab Navigation**
- Three-tab interface: Overview · Curriculum · Reviews
- ARIA tab pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls`, `aria-selected`
- `initTabs()` in `course-detail.js` — click switching, active state, panel show/hide via `hidden`
- Keyboard navigation: Arrow Left/Right, Home, End
- `tabindex="-1"` on inactive tabs — only active tab in tab order

**Day 3 — Search Suggestions, Highlighting & History**
- `#search-suggestions` dropdown in `courses.html` — `position: absolute` below search input
- `buildSuggestions(term)` — filters `allCourses` by title, highlights match with `<mark>`, caps at 5 results
- `hideSuggestions()` — clears and hides the dropdown
- `highlightCardTitles(term)` — wraps matched text in course card titles with `<mark>` after filtering
- `saveSearchHistory(term)` — saves completed searches to `sf_search_history` (max 5, deduplicated)
- `showSearchHistory()` — shows recent searches with 🕐 icon when input is focused and empty
- `RegExp` constructor with escaped user input for safe dynamic regex
- Highlight clears when search is cleared or filter runs with no term

**Day 3 — Enroll Button & My Courses Dashboard Section**
- `initEnrollButton()` in `course-detail.js` — writes/reads `sf_enrolled_courses`, keeps hero + sidebar CTA in sync
- Green enrolled state via `.course-hero__enroll-btn--enrolled` CSS modifier
- `renderEnrolledCourses()` on dashboard — reuses `buildDashCard()`, renders enrolled cards in My Courses section

**Day 4 — Progress Tracking, Bars & Update Control**
- `sf_course_progress` object stores per-course percentage `{ courseId: 0–100 }`
- `buildDashCard(course, progress)` — optional second param adds progress bar to enrolled cards
- `initProgressControl()` — 5 quick-select buttons on course detail, only shown when enrolled
- `storage` event case for `sf_course_progress` — re-renders enrolled cards cross-tab

**Day 5 — Auto-Complete, Continue Learning & Full User Journey**
- `saveProgress()` auto-writes `sf_completed_courses` at 100%, removes entry below 100%
- `renderContinueLearning()` — picks highest in-progress enrolled course, prominent card at top of dashboard
- CTA adapts: "Start Learning" (0%) / "Continue" (1–99%) / "Review Course" (100%)
- Full user journey complete: Discover → Save → Enroll → Track Progress → Complete

### Week 6 — Backend Integration (Express API)

**Day 1 — Express Server Setup**
- `server/server.js` — Express server on port 3000
- `GET /api/health` — health check endpoint
- `GET /api/courses` — returns all courses from `data/courses.json` as `{ courses: [...] }`
- `GET /api/courses/:id` — returns a single course by slug ID, 404 if not found
- CORS configured with `cors` middleware, allows requests from the Live Server origin
- Input validation on `:id` parameter — rejects slugs with invalid characters
- `server/package.json` with `nodemon` for auto-reload during development
- `.gitignore` updated to exclude `server/node_modules`

**Day 3 — Auth Endpoints**
- `POST /api/auth/register` — validates name/email/password, hashes with bcrypt (10 rounds), stores in-memory, returns `{ token, user }`
- `POST /api/auth/login` — timing-safe bcrypt compare, same error for bad email/bad password (prevents enumeration), returns `{ token, user }`
- `bcryptjs@2.4.3` — pure JS, no native binaries, works on Node v24
- `jsonwebtoken@9.0.2` — JWT signed with `JWT_SECRET`, expires in 7 days
- In-memory `users` array — resets on server restart, replaced by DB in a later week
- Password never stored in plain text — only bcrypt hash

**Day 5 — CORS Hardening, dotenv & Error Handling**
- `dotenv@16.4.7` installed; `server/.env` loads `PORT`, `JWT_SECRET`, `ALLOWED_ORIGINS` at startup
- `server/.env.example` committed as a safe template (`.env` itself is gitignored)
- CORS uses a dynamic origin function — reads `ALLOWED_ORIGINS` from `.env`, rejects unknown origins with 403, logs every blocked request
- `file://` protocol (`origin: 'null'`) allowed during development; same-origin and non-browser tools (curl/Postman) always pass through
- Global error handler catches malformed JSON bodies (400), CORS rejections (403), and all other unhandled errors (500)
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` guards added
- `GET /api/health` now returns `users` count and `env` field
- `API_BASE` in `courses.js`, `course-detail.js`, and `auth.js` replaced with an environment-aware IIFE: `localhost`/`127.0.0.1` → `http://localhost:3000/api`, any other host → `/api` (same-origin for deployed builds)
- Server startup logs show loaded courses count, allowed CORS origins, and a warning if `JWT_SECRET` is not set in `.env`
- `pages/auth.html` — tabbed Sign Up / Log In page, ARIA tab pattern with keyboard support
- `pages/login.html` + `pages/register.html` — instant-redirect shims so existing navbar links work
- `js/auth.js` — register form (POST `/api/auth/register`), login form (POST `/api/auth/login`), client-side validation, error display, JWT + user stored in localStorage on success, redirect to dashboard
- `js/navbar-auth.js` — loaded on every page, reads auth state from localStorage, swaps navbar between logged-out (Log In / Sign Up Free) and logged-in (username link + Log Out button) states
- `css/pages/auth.css` — auth card, tab switcher, form fields, inline errors, message banners
- Logout removes only `sf_auth_token` and `sf_auth_user` — does not touch wishlist, enrolled courses, progress, or any other SkillForge data
- Cross-tab sync — `storage` event keeps all open tabs in sync when login/logout fires
- `sf_user_name` written on login/register so existing dashboard and profile pages work unchanged
- Profile page Reset All Data updated to also clear auth keys
- Fixed `??` emoji encoding bug in `courses.html` profile link
- Password is never stored anywhere in the browser

---

## Week 7 — Database & Advanced Backend

### Week 7 Day 1 — MongoDB Integration

**Why:** The previous in-memory `users[]` array reset on every server restart. Any registered user was permanently lost. MongoDB provides persistent, reliable storage that survives restarts and scales to production.

**Architecture:**
```
Frontend → Express → Mongoose → MongoDB Atlas
```

**What was built:**

- `server/db.js` — `connectDB()` reads `MONGODB_URI` from `.env`, connects via Mongoose, throws fast on failure so the server never starts in a broken state
- `server/models/User.js` — Mongoose schema: `name` (2–100 chars), `email` (unique index, lowercase), `passwordHash`, `createdAt`/`updatedAt` (auto via `timestamps: true`)
- Schema `toJSON` transform — strips `passwordHash` and `__v` if a document is ever serialised directly, as a defence-in-depth measure
- `server/server.js` — `const users = []` removed entirely; register and login now use `User.findOne()`, `new User().save()`, and `User.countDocuments()`
- `startServer()` — server binds to port only after MongoDB connection is confirmed; exits with code 1 on DB failure
- `mongoose@8.24.3` installed (upgraded from 8.5.1 to resolve a critical prototype pollution CVE — 0 vulnerabilities)
- `server/.env.example` updated with `MONGODB_URI` placeholder and format examples for both Atlas and local MongoDB

**Persistence verified:**
- Registered a user → restarted the server → logged in successfully with the same account
- Duplicate email, wrong password, and missing fields all still return correct error codes
- `passwordHash` is absent from every API response
- `GET /api/health` now queries `User.countDocuments()` for a live user count from MongoDB

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
│   ├── empty-state-demo.html         Empty state demo
│   ├── auth.html                     Sign Up / Log In page (tabbed)
│   ├── login.html                    Redirect shim → auth.html?tab=login
│   └── register.html                 Redirect shim → auth.html?tab=register
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
│       ├── profile.css               Profile and settings page styles
│       └── auth.css                  Sign Up / Log In page styles
│
├── js/
│   ├── courses.js                    Filter, search, sort, empty state, wishlist
│   ├── course-detail.js              URL params, fetch, DOM rendering, save button
│   ├── dashboard.js                  localStorage reads, course rendering, recommendations
│   ├── profile.js                    Form validation, name save, danger zone, cross-tab sync
│   ├── auth.js                       Register/login forms, API calls, JWT storage
│   ├── navbar-auth.js                Navbar auth state (loaded on every page)
│   └── transitions.js                View Transitions API page animations
│
├── data/
│   └── courses.json                  All 12 courses with full structured data
│
├── server/
│   ├── server.js                     Express API server (port 3000)
│   ├── db.js                         MongoDB connection (Mongoose)
│   ├── models/
│   │   └── User.js                   Mongoose User schema and model
│   ├── package.json                  Server dependencies (express, cors, bcryptjs, jsonwebtoken, dotenv, mongoose, nodemon)
│   ├── .env.example                  Environment variable template (copy to .env)
│   └── .env                          Local secrets — gitignored, never committed
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

**Prerequisites:** VS Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) installed. Node.js 18+ for the backend API.

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/SkillForge.git

# Open in VS Code
code SkillForge

# Start the API server (terminal 1)
cd server
npm install
cp .env.example .env        # then edit .env to set JWT_SECRET
npm run dev          # starts Express on http://localhost:3000

# Start the frontend (terminal 2)
# Right-click index.html in the Explorer panel
# Select "Open with Live Server"
```

Navigate to `http://127.0.0.1:5500` in your browser. The API server must be running for the courses catalog and course detail pages to load data.

> **MongoDB:** The API requires a MongoDB connection. Add your Atlas connection string to `server/.env` as `MONGODB_URI`. See `server/.env.example` for the format.

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
- [x] Enroll Now button on course detail pages (sf_enrolled_courses)
- [x] Enrolled Courses section on dashboard (My Courses)
- [x] Enrolled count updates on dashboard and profile stats
- [x] Progress bars on enrolled dashboard cards (sf_course_progress)
- [x] Progress update control on course detail page (0/25/50/75/100%)
- [x] Auto-complete: 100% progress writes to sf_completed_courses
- [x] Continue Learning section at top of dashboard
- [x] Cross-tab sync for progress changes via storage event
- [ ] Progress indicators

### Week 5 (In Progress)
- [x] Page fade-in animation (`@keyframes page-enter` on `body`)
- [x] View Transitions API for smooth cross-page cross-fade
- [x] Course detail tab navigation with ARIA and keyboard support
- [x] Search suggestions dropdown with regex highlighting
- [x] Highlighted match text in course card titles
- [x] Search history (localStorage, max 5 recent searches)
- [ ] Accessibility audit and keyboard navigation pass
- [ ] Performance and Lighthouse audit

### Week 6 (Complete ✅)
- [x] Express server with CORS and validation
- [x] `GET /api/health`, `GET /api/courses`, `GET /api/courses/:id`
- [x] Frontend courses page fetches from Express API
- [x] Frontend course detail page fetches single course from Express API
- [x] 404 handled end-to-end (server + frontend error state)
- [x] `POST /api/auth/register` — bcrypt password hashing, JWT response
- [x] `POST /api/auth/login` — timing-safe comparison, JWT response
- [x] `pages/auth.html` — tabbed Sign Up / Log In page
- [x] `js/auth.js` — register + login forms connected to API
- [x] `js/navbar-auth.js` — dynamic navbar auth state on every page
- [x] Logout removes JWT, restores logged-out navbar
- [x] Cross-tab auth sync via `storage` event
- [x] `dotenv` — `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS` from `.env`
- [x] CORS hardened — dynamic origin check, unknown origins blocked with 403
- [x] Global error handler — malformed JSON (400), CORS (403), unhandled errors (500)
- [x] `API_BASE` environment-aware IIFE in all frontend JS files

---

**Mohit Khatri**
B.Tech CSE (IoT)
Passionate about frontend development, clean architecture, and building real-world projects.

### Week 7 (In Progress)
- [x] MongoDB Atlas connection via Mongoose (`server/db.js`)
- [x] Mongoose User model with unique email index (`server/models/User.js`)
- [x] Register endpoint writes to MongoDB (`User.save()`)
- [x] Login endpoint reads from MongoDB (`User.findOne()`)
- [x] In-memory `users[]` array removed
- [x] Server startup fails fast if MongoDB is unreachable
- [x] User data persists across server restarts
- [ ] Protected API routes (JWT middleware)
- [ ] User profile API (`GET /api/me`, `PUT /api/me`)
- [ ] Move enrolled courses and progress to database

---

## License

This project is created for educational and learning purposes.
