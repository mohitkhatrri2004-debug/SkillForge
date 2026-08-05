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
| Week 3 | JavaScript Interactivity, Dynamic Content | 🔄 Day 4 of 5 Complete |
| Week 4+ | Advanced Features, Backend Integration | Planned |

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

**Day 4 — localStorage Persistence & Wishlist**
- `saveUIState()` — persists active filter and search term to `localStorage` on every change
- `restoreUIState()` — reads saved filter/search from `localStorage` on page load and re-applies them
- Active filter button and search input both restore correctly after page reload
- `getSavedCourses()` — reads saved course ID array from `localStorage` (JSON.parse + fallback)
- `toggleSavedCourse(courseId)` — adds or removes a course ID from the saved array, persists to `localStorage`
- Save button (♡/♥) added to every course card footer via `buildCardHTML()`
- `updateSaveButton()` — updates one button's visual state and accessible `aria-label`
- `updateAllSaveButtons()` — restores saved visual state across all cards on page load
- Event delegation on the grid — one listener handles all save button clicks
- `sf_` prefixed `localStorage` keys prevent clashes with browser extensions
- `JSON.stringify` / `JSON.parse` used correctly to persist arrays

---

## File Structure

```
SkillForge/
├── index.html                        Homepage
│
├── pages/
│   ├── courses.html                  Course catalog (12 cards, filter, search)
│   ├── course-detail.html            Dynamic course detail template
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
│       └── course-detail.css         Detail page styles
│
├── js/
│   ├── courses.js                    Filter, search, empty state logic
│   └── course-detail.js              URL params, fetch, DOM rendering
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
- State tracked in module-level variables (`activeFilter`, `activeSearch`)
- Pure helper functions with single responsibilities
- `async/await` for all asynchronous operations
- `try/catch` on all `fetch()` calls
- Guard clauses (`if (!el) return`) prevent null reference errors
- `js-*` prefixed classes used as JS-only identifiers (never styled)
- `sf_` prefixed `localStorage` keys prevent clashes with other scripts
- Event delegation for dynamically rendered elements (one listener per container)
- `JSON.stringify` / `JSON.parse` for persisting arrays to `localStorage`

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

### Week 3 (In Progress)
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
- [ ] Page transitions and polish

### Week 4+
- [ ] User authentication UI
- [ ] Dashboard and progress tracking
- [ ] Certificate generation
- [ ] Dark mode
- [ ] Backend API integration (Node.js + Express)
- [ ] Database (MongoDB)
- [ ] Cloud deployment

---

## Author

**Mohit Khatri**
B.Tech CSE (IoT)
Passionate about frontend development, clean architecture, and building real-world projects.

---

## License

This project is created for educational and learning purposes.
