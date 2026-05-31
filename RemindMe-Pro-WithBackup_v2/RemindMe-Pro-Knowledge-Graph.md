# 🧠 RemindMe Pro — Codebase Knowledge Graph

> **22 files | ~53 KB | Zero Dependencies | Vanilla JavaScript PWA**
> Generated: May 30, 2026

---

## 1. Architecture Overview

```
                            ┌───────────────────┐
                            │    index.html      │  ← Single Entry Point
                            │  (App Shell + PWA) │
                            └─────────┬─────────┘
                                      │ loads
                   ┌──────────────────┼──────────────────┐
                   │                  │                  │
           ┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
           │   CSS Layer   │  │    js/app.js   │  │    sw.js    │
           │   (5 files)   │  │  Main Entry    │  │  Service    │
           │   Theme +     │  │  Orchestrator  │  │  Worker     │
           │   Layout +    │  └───────┬───────┘  └─────────────┘
           │   Components  │          │
           └───────────────┘          │ imports
                          ┌───────────┼───────────┐
                          │           │           │
                  ┌───────▼──┐ ┌──────▼─────┐ ┌───▼──────┐
                  │  UTILS   │ │  SERVICES  │ │  PAGES   │
                  │  (2)     │ │  (4)       │ │  (4)     │
                  │ state.js │ │ db.js      │ │ home.js  │
                  │ helpers  │ │ notifs.js  │ │ categs   │
                  │          │ │ theme.js   │ │ calendar │
                  │          │ │ backup.js  │ │ settings │
                  └──────────┘ └────────────┘ └──────────┘
```

---

## 2. Node Catalog — Every File & Function

---

### 🏠 ROOT FILES

#### `index.html` — App Shell
- **Type:** Entry Point
- **Description:** Single HTML page containing the app shell structure — sticky header, scrollable `<main>`, fixed bottom navigation (4 tabs), floating action button (FAB), task creation `<dialog>`, delete confirmation `<dialog>`, and toast notification container.
- **Key Elements:** `#app`, `#app-header`, `#app-content`, `#bottom-nav`, `#fab`, `#task-dialog`, `#confirm-dialog`, `#toast`
- **Connects to:** All CSS files (stylesheet links), `js/app.js` (module script)

#### `manifest.json` — PWA Manifest
- **Type:** Configuration
- **Description:** Declares app name ("RemindMe Pro"), theme color (#6C63FF), standalone display mode, portrait orientation, and icon references for PWA installability.

#### `sw.js` — Service Worker
- **Type:** Background Worker
- **Description:** Runs independently of the main thread. Handles 4 responsibilities:
  - `install` → Caches all static assets into `remindme-v1` cache
  - `activate` → Cleans old cache versions
  - `fetch` → Cache-first strategy (serve cached, fallback to network)
  - `push` → Shows browser notification with Done/Snooze action buttons
  - `notificationclick` → Posts message to app (`TASK_DONE` or `TASK_SNOOZE`)

#### `README.md` — Documentation
- **Type:** Docs
- **Description:** Project overview, feature list, quick start commands (`npx serve .`)

---

### 🎨 CSS LAYER (5 files)

#### `css/variables.css` — Design Tokens
- **Description:** All CSS Custom Properties for the entire app. Defines light theme defaults on `:root` and dark overrides on `[data-theme="dark"]`.
- **Key Tokens:** `--primary` (#6C63FF), `--bg`, `--surface`, `--text`, `--border`, `--priority-low/medium/high/critical`, `--shadow-sm/md/lg`, `--space-xs/sm/md/lg/xl`, `--radius-sm/md/lg/full`, `--transition-fast/normal`, `--font-family`
- **Theme Switch:** Changing `data-theme` attribute on `<html>` instantly swaps all colors

#### `css/base.css` — Reset & Typography
- **Description:** Box model reset (`* { box-sizing: border-box }`), body defaults (font-family, background, color transitions), heading sizes (h1=32px, h2=24px, h3=18px), input/focus styles with purple ring, range/checkbox accent color.

#### `css/layout.css` — App Structure
- **Description:** Flexbox column layout for `#app` (max-width 480px centered), sticky header, scrollable content with bottom padding for nav, fixed bottom navigation bar, responsive breakpoints at 768px and 1024px.
- **Key Classes:** `#app`, `#app-header`, `#app-content`, `#bottom-nav`, `.nav-btn`, `.nav-icon`, `.nav-label`

#### `css/components.css` — UI Components
- **Description:** Styles for all interactive elements:
  - `.fab` — Fixed circular button, hover scale, active press
  - `dialog` — Bottom sheet with rounded top corners, backdrop overlay
  - `.form-group`, `.btn`, `.btn-primary/secondary/danger/sm` — Form elements
  - `.task-card` — Card with priority left-border, hover lift
  - `.calendar-grid`, `.calendar-day` — 7-column grid, today highlight, task dots
  - `.categories-grid`, `.category-card` — 2-column grid with icons
  - `.settings-section`, `.setting-item`, `.toggle` — Settings UI
  - `.stats-row`, `.stat-card` — Dashboard stats
  - `.toast` — Fixed bottom notification bar
  - `.empty-state` — Centered placeholder with emoji

#### `css/animations.css` — Micro-Animations
- **Description:** 5 keyframe animations + stagger delays:
  - `fadeIn` — Opacity 0→1 + translateY 10px→0 (page transitions)
  - `slideUp` — translateY 100%→0 (dialog opening)
  - `checkmark` — scale 0→1.2→1 (task completion)
  - `swipeOut` — translateX→-100% + collapse (task deletion)
  - `pulse` — scale 1→1.05→1 infinite (notification badge)
  - `.stagger-1/2/3/4` — Cascading animation delays

---

### ⚙️ JS UTILITIES (2 files)

#### `js/utils/state.js` — Reactive State Store
| Export | Description |
|--------|-------------|
| `createStore(initialState)` | Factory function: wraps object in `Proxy`; on any property `set`, notifies all subscribed listener functions with `(key, newValue, oldValue)` |
| `store` | Singleton instance with properties: `tasks[]`, `categories[]`, `currentPage`, `theme`, `isOnline` |

- **Pattern:** Observer via Proxy (~10 lines, replaces Redux/Vuex)
- **Used by:** `app.js` (read/write `currentPage`, `isOnline`)

#### `js/utils/helpers.js` — Pure Utility Functions
| Export | Description |
|--------|-------------|
| `generateId()` | Returns UUID via `crypto.randomUUID()` with `Date.now()+Math.random()` fallback |
| `formatDate(date)` | Full format: "Mon, 30 May, 03:00 pm" via `Intl.DateTimeFormat` |
| `formatDateShort(date)` | Short format: "30 May, 03:00 pm" |
| `getDateLabel(dateStr)` | Compares to today → returns `"Overdue"`, `"Today"`, `"Tomorrow"`, `"This Week"`, or `"Upcoming"` |
| `showToast(msg, duration)` | Shows `#toast` element with message, auto-hides after `duration` ms (default 3000) |
| `getCategoryIcon(category)` | Maps string to emoji: `work→💼`, `health→💊`, `study→📚`, `finance→💰`, `personal→🏠`, `general→📌` |
| `getPriorityLabel(priority)` | Maps to colored label: `critical→🔴 Critical`, `high→🟠 High`, etc. |

- **Dependencies:** None (pure functions)
- **Used by:** `app.js`, `home.js`, `categories.js`, `settings.js`

---

### 🔧 JS SERVICES (4 files)

#### `js/services/db.js` — IndexedDB Data Layer
| Export | Description |
|--------|-------------|
| `openDB()` | Opens/creates `RemindMeProDB` v1; creates `tasks` object store with keyPath `id` and indexes on `dueDate`, `priority`, `category`, `status` |
| `addTask(task)` | Inserts task object via `readwrite` transaction → `.add()` |
| `getAllTasks()` | Returns all tasks via `readonly` transaction → `.getAll()` |
| `updateTask(task)` | Upserts task via `readwrite` transaction → `.put()` |
| `deleteTask(id)` | Removes task by id via `readwrite` transaction → `.delete()` |

- **Internal State:** `db` — cached database connection (singleton)
- **Schema:**
  ```
  tasks { id(PK), title, description, dueDate(IDX), priority(IDX),
          category(IDX), reminderCount, intervalMs, remindUntilDone,
          maxSnooze, snoozeCount, status(IDX), createdAt, completedAt }
  ```
- **Used by:** `app.js`, `home.js`, `categories.js`, `calendar.js`, `settings.js`, `backup.js`

#### `js/services/notifications.js` — Multi-Fire Notification Engine
| Export | Description |
|--------|-------------|
| `requestPermission()` | Calls `Notification.requestPermission()`; returns `true` if granted |
| `showNotification(task, count)` | Creates browser `Notification` with body "Reminder X of Y", icon, tag, `requireInteraction: true` |
| `scheduleMultiFire(task)` | Core engine: calculates delay to `dueDate`; sets `setTimeout` chain of N notifications at `intervalMs` intervals; checks `localStorage(task-ack-{id})` before each fire; dispatches `reminder-fired` CustomEvent for in-app toast |
| `cancelReminders(taskId)` | Clears all `setTimeout` handles from `activeTimers` Map for given task |
| `acknowledgeTask(taskId)` | Sets `localStorage(task-ack-{id})=true`; calls `cancelReminders()` |
| `snoozeTask(task, ms)` | Cancels current timers → creates new task copy with `dueDate = now + ms` and `snoozeCount++` → re-schedules; returns updated task |

- **Internal State:** `activeTimers` — `Map<string, number[]>` tracking setTimeout IDs per task
- **Used by:** `app.js`, `home.js`

#### `js/services/theme.js` — Theme Manager
| Export | Description |
|--------|-------------|
| `getTheme()` | Reads `localStorage('remindme-theme')`; defaults to `'light'` |
| `setTheme(theme)` | Writes to localStorage + sets `document.documentElement.dataset.theme` |
| `toggleTheme()` | Flips dark↔light; returns new theme string |
| `initTheme()` | On load: applies saved theme; listens for `prefers-color-scheme` media query changes for system-follow mode |

- **Mechanism:** Setting `data-theme="dark"` on `<html>` activates `[data-theme="dark"]` CSS overrides in `variables.css`
- **Used by:** `app.js`, `settings.js`

#### `js/services/backup.js` — Import/Export & Auto-Backup
| Export | Description |
|--------|-------------|
| `exportAsJSON()` | `getAllTasks()` → wraps in `{app, version, exportDate, taskCount, tasks}` → `Blob` → triggers `.json` file download |
| `exportAsCSV()` | `getAllTasks()` → converts to CSV with 14-column headers → triggers `.csv` file download |
| `importFromJSON(file)` | `FileReader.readAsText()` → `JSON.parse()` → validates required fields (`id, title, dueDate, priority, status`) → returns parsed backup object |
| `restoreFromBackup(data, mode)` | `mode='merge'`: skips tasks with existing IDs, adds only new. `mode='replace'`: deletes all existing first, then adds all. Returns `{imported, skipped, replaced}` |
| `autoBackup()` | Saves all tasks to `localStorage('remindme-auto-backups')` as JSON; keeps rolling window of last 3 snapshots |
| `getAutoBackups()` | Returns array of auto-backup snapshots from localStorage |
| `restoreAutoBackup(index, mode)` | Restores from a specific auto-backup by array index |
| `isAutoBackupEnabled()` | Checks `localStorage('remindme-auto-backup-enabled')` boolean flag |
| `setAutoBackupEnabled(bool)` | Sets the auto-backup enabled flag in localStorage |
| `startAutoBackup()` | Starts `setInterval` at 30-minute cadence + runs immediate backup |
| `stopAutoBackup()` | Clears the interval timer |

- **Internal Helpers:** `downloadFile(blob, name)` — creates `<a>` + `URL.createObjectURL()` + click; `getDateStamp()` — YYYY-MM-DD; `esc(str)` — CSV field escaping
- **Used by:** `app.js`, `settings.js`

---

### 📄 JS PAGES (4 files)

#### `js/pages/home.js` — Home Page (Task List)
| Export | Description |
|--------|-------------|
| `renderHome()` | Main view: fetches all tasks → computes stats (pending/overdue/completed) → renders stats row → groups pending tasks by date label (Overdue→Today→Tomorrow→This Week→Upcoming) → renders task cards with priority border, meta info, action buttons → wires ✅Done / 💤Snooze / 🗑️Delete click handlers → renders collapsible completed section |

- **Internal:** `escHtml(text)` — XSS-safe text escaping via `textContent`
- **Imports:** `db.{getAllTasks, updateTask, deleteTask}`, `notifications.{acknowledgeTask, cancelReminders}`, `helpers.{formatDateShort, getDateLabel, showToast, getCategoryIcon}`

#### `js/pages/categories.js` — Categories Page
| Export | Description |
|--------|-------------|
| `renderCategories()` | Fetches all tasks → counts pending tasks per category → renders 2×3 grid of category cards with emoji icons and counts → click handler: filters tasks by selected category and renders them below the grid |

- **Imports:** `db.getAllTasks`, `helpers.getCategoryIcon`

#### `js/pages/calendar.js` — Calendar Page
| Export | Description |
|--------|-------------|
| `renderCalendar()` | Fetches all tasks → builds month grid (7-column CSS grid) → marks today cell, days with tasks (dot indicator) → prev/next month navigation buttons → click any day to see that day's tasks listed below |

- **Internal State:** `cM` (currentMonth), `cY` (currentYear) — module-scoped for navigation persistence
- **Imports:** `db.getAllTasks`

#### `js/pages/settings.js` — Settings Page (with Backup UI)
| Export | Description |
|--------|-------------|
| `renderSettings()` | Renders 6 sections with full interactivity: **Appearance** (dark mode toggle switch), **Notifications** (enable button + permission status), **Backup & Restore** (Export JSON button, Export CSV button, Import file picker with merge/replace mode, Auto-backup toggle, backup history list with restore buttons), **Statistics** (total/pending/completed counts), **Data Management** (clear completed, delete all with auto-backup-before-delete), **About** (version, author) |

- **Imports:** `theme.{getTheme, setTheme}`, `db.{getAllTasks, deleteTask}`, `notifications.requestPermission`, `helpers.showToast`, `backup.*` (all 12 exports)
- **Highest import count** of any page (5 modules)

---

### 🚀 `js/app.js` — Main Application Orchestrator

| Function | Description |
|----------|-------------|
| `navigateTo(page)` | Sets active nav button styling; calls matching page render function from `pages` map |
| `setupTaskForm()` | Wires FAB → open dialog with smart defaults (date = now+1hr); form submit → validate title+date → build task object with `generateId()` → `addTask()` to IndexedDB → `scheduleMultiFire()` → close dialog → toast → navigate home. Also wires reminder count slider, "Until Done" checkbox toggle, and cancel/backdrop-close |
| `setupNav()` | Attaches click listeners to all 4 `.nav-btn` elements → calls `navigateTo()` |
| `scheduleExisting()` | On app load: fetches all pending tasks from DB and calls `scheduleMultiFire()` on each |
| `setupReminders()` | Listens for `reminder-fired` CustomEvent → shows in-app toast with task title and count |
| `registerSW()` | Registers `/sw.js` as Service Worker |
| `setupSW()` | Listens for `message` events from SW: `TASK_DONE` → acknowledge + mark completed in DB; `TASK_SNOOZE` → snooze 15 min + update DB |
| `init()` | **Bootstrap sequence (10 steps):** 1) initTheme 2) openDB 3) setupNav 4) setupTaskForm 5) navigateTo('home') 6) requestPermission 7) scheduleExisting 8) setupReminders 9) registerSW + setupSW 10) connectivity listeners + beforeunload auto-backup + startAutoBackup |

- **Imports:** ALL 4 services, ALL 4 pages, both utils
- **Error handling:** Catches init failure → renders error state with reload button

---

## 3. Dependency Graph

```
js/app.js (ORCHESTRATOR)
│
├──▶ js/utils/state.js ──────────────── store
├──▶ js/utils/helpers.js ────────────── generateId, showToast
│
├──▶ js/services/theme.js ──────────── initTheme
├──▶ js/services/db.js ────────────── openDB, addTask, getAllTasks, updateTask
├──▶ js/services/notifications.js ──── requestPermission, scheduleMultiFire,
│                                       snoozeTask, acknowledgeTask
├──▶ js/services/backup.js ─────────── startAutoBackup, isAutoBackupEnabled,
│                                       autoBackup
│
├──▶ js/pages/home.js
│    ├──▶ db.js ──────── getAllTasks, updateTask, deleteTask
│    ├──▶ notifications.js ── acknowledgeTask, cancelReminders
│    └──▶ helpers.js ──── formatDateShort, getDateLabel, showToast, getCategoryIcon
│
├──▶ js/pages/categories.js
│    ├──▶ db.js ──────── getAllTasks
│    └──▶ helpers.js ──── getCategoryIcon
│
├──▶ js/pages/calendar.js
│    └──▶ db.js ──────── getAllTasks
│
└──▶ js/pages/settings.js
     ├──▶ theme.js ───── getTheme, setTheme
     ├──▶ db.js ──────── getAllTasks, deleteTask
     ├──▶ notifications.js ── requestPermission
     ├──▶ backup.js ──── ALL 12 exports
     └──▶ helpers.js ──── showToast

js/services/backup.js
└──▶ db.js ──────────── getAllTasks, addTask, deleteTask
```

---

## 4. Data Flow Diagrams

### 4.1 Task Creation Flow
```
User taps [+] FAB
       │
       ▼
task-dialog.showModal()  ← pre-filled: date=now+1hr, priority=medium
       │
       ▼ user fills form
form 'submit' event
       │
       ▼
Validate: title required, date required
       │
       ▼
generateId() → build task object (14 fields)
       │
       ▼
addTask(task) ──→ IndexedDB.tasks.add()
       │
       ▼
scheduleMultiFire(task) ──→ setTimeout chain registered
       │
       ▼
dialog.close() → showToast("✅ Created") → navigateTo('home')
```

### 4.2 Multi-Fire Notification Flow
```
scheduleMultiFire(task)
       │
       ▼
delay = dueDate - now
       │
       ├── delay > 0 ──→ setTimeout(fireAll, delay)
       └── delay ≤ 0 ──→ fireAll() immediately
                │
                ▼
          for i = 0 → reminderCount:
              setTimeout(() => {
                  │
                  ▼
              localStorage.get('task-ack-{id}')
                  │
                  ├── 'true' → SKIP (already acknowledged)
                  └── 'false' →
                      ├── new Notification("Reminder {i+1} of {N}")
                      └── dispatch CustomEvent('reminder-fired')
                               │
                               ▼
                          app.js listener → showToast()
              }, intervalMs × i)
```

### 4.3 Backup & Restore Flow
```
 ┌─── EXPORT ────────────────┐    ┌─── IMPORT ─────────────────┐
 │                            │    │                             │
 │ getAllTasks()               │    │ User picks .json file       │
 │      │                     │    │      │                      │
 │      ▼                     │    │      ▼                      │
 │ Build JSON/CSV blob        │    │ FileReader.readAsText()     │
 │      │                     │    │      │                      │
 │      ▼                     │    │      ▼                      │
 │ URL.createObjectURL()      │    │ JSON.parse() + validate     │
 │      │                     │    │      │                      │
 │      ▼                     │    │      ▼                      │
 │ <a>.click() → download    │    │ Choose: merge | replace     │
 │                            │    │      │                      │
 │ remindme-backup-           │    │      ├── merge: skip dupes  │
 │   2026-05-30.json          │    │      └── replace: del + add │
 └────────────────────────────┘    │      │                      │
                                   │      ▼                      │
 ┌─── AUTO-BACKUP ───────────┐    │ showToast(result)           │
 │                            │    │ renderSettings()            │
 │ setInterval(30 min)        │    └─────────────────────────────┘
 │      │                     │
 │      ▼                     │
 │ getAllTasks() → JSON        │
 │      │                     │
 │      ▼                     │
 │ localStorage (last 3)      │
 └────────────────────────────┘
```

### 4.4 Theme Switch Flow
```
User toggles switch in Settings
       │
       ▼
setTheme('dark' | 'light')
       │
       ├── localStorage.setItem('remindme-theme', theme)
       └── document.documentElement.dataset.theme = theme
                │
                ▼
       CSS [data-theme="dark"] { ... } activates
                │
                ▼
       All var(--primary), var(--bg), var(--text), etc. swap
                │
                ▼
       Entire UI re-themes in <1ms (no reload)
```

### 4.5 Navigation Flow
```
User taps nav button (Home | Categories | Calendar | Settings)
       │
       ▼
navigateTo(page)
       │
       ├── Update .nav-btn.active class
       └── Call pages[page]() render function
                │
                ▼
       Render function:
           1. Set header title
           2. Fetch data from IndexedDB
           3. Build HTML string
           4. Set content.innerHTML
           5. Wire event listeners
```

---

## 5. Storage Map

| Storage Type | Key | Data | Read By | Written By |
|-------------|-----|------|---------|------------|
| **IndexedDB** | `RemindMeProDB → tasks` | All task objects (full 14-field schema) | db.js | db.js |
| **localStorage** | `remindme-theme` | `"light"` or `"dark"` | theme.js | theme.js |
| **localStorage** | `task-ack-{taskId}` | `"true"` when task acknowledged | notifications.js | notifications.js |
| **localStorage** | `remindme-auto-backups` | JSON array of last 3 backup snapshots | backup.js | backup.js |
| **localStorage** | `remindme-auto-backup-enabled` | `"true"` or `"false"` | backup.js | backup.js |
| **Cache API** | `remindme-v1` | Cached HTML, CSS, JS, manifest | sw.js (fetch) | sw.js (install) |

---

## 6. Event System

| Event | Source | Listener | Action |
|-------|--------|----------|--------|
| `click` `.nav-btn` | User | `app.js setupNav()` | `navigateTo(page)` |
| `click` `#fab` | User | `app.js setupTaskForm()` | Open task creation dialog |
| `submit` `#task-form` | User | `app.js setupTaskForm()` | Validate → create → save → schedule → navigate |
| `click` `.complete-btn` | User | `home.js renderHome()` | Mark done → update DB → acknowledge → re-render |
| `click` `.snooze-btn` | User | `home.js renderHome()` | Snooze 15 min → update DB → re-render |
| `click` `.delete-btn` | User | `home.js renderHome()` | Show confirm → delete from DB → cancel timers |
| `click` `.category-card` | User | `categories.js` | Filter + show tasks for that category |
| `click` `.calendar-day` | User | `calendar.js` | Show tasks for that specific day |
| `change` `#theme-toggle` | User | `settings.js` | Toggle dark/light mode |
| `change` `#import-file` | User | `settings.js` | Parse JSON → merge/replace → refresh |
| `change` `#auto-backup-toggle` | User | `settings.js` | Start/stop 30-min auto-backup |
| `reminder-fired` | `notifications.js` | `app.js setupReminders()` | Show in-app toast |
| `message` from SW | `sw.js` | `app.js setupSW()` | Handle TASK_DONE / TASK_SNOOZE |
| `beforeunload` | Browser | `app.js init()` | Auto-backup if enabled |
| `online` / `offline` | Browser | `app.js init()` | Show connectivity toast |
| `beforeinstallprompt` | Browser | `app.js` | Capture deferred PWA install prompt |

---

## 7. Complexity Metrics

| File | Size | Exports | Imports | Complexity | Role |
|------|------|---------|---------|------------|------|
| `js/app.js` | 6.1 KB | 0 (entry) | 6 modules | 🔴 High | Orchestrator — wires everything |
| `js/pages/settings.js` | 8.4 KB | 1 | 5 modules | 🔴 High | Most complex page — backup UI |
| `js/services/backup.js` | 5.8 KB | 12 | 1 module | 🟡 Medium | Import/export engine |
| `js/pages/home.js` | 5.1 KB | 1 | 3 modules | 🟡 Medium | Task list + 3 action handlers |
| `js/pages/calendar.js` | 2.8 KB | 1 | 1 module | 🟢 Low | Month grid rendering |
| `js/pages/categories.js` | 1.9 KB | 1 | 2 modules | 🟢 Low | Category grid + filter |
| `js/services/notifications.js` | 1.7 KB | 6 | 0 | 🟡 Medium | Timer management |
| `js/services/db.js` | 1.5 KB | 5 | 0 | 🟢 Low | CRUD wrapper |
| `js/utils/helpers.js` | 1.2 KB | 7 | 0 | 🟢 Low | Pure functions |
| `js/services/theme.js` | 0.6 KB | 4 | 0 | 🟢 Low | Simple toggle |
| `js/utils/state.js` | 0.5 KB | 1 | 0 | 🟢 Low | Proxy store |
| `css/components.css` | 6.6 KB | — | — | 🟡 Medium | All component styles |
| `css/variables.css` | 1.2 KB | — | — | 🟢 Low | Design tokens |
| `sw.js` | 1.3 KB | 0 (worker) | 0 | 🟢 Low | Cache + push |
| `index.html` | 4.7 KB | — | — | 🟢 Low | App shell |

---

*RemindMe Pro v1.0.0 | 22 files | ~53 KB | Vanilla JS | Zero Dependencies*
