# 🧠 RemindMe Pro — Codebase Knowledge Graph v1.2

> **22 files | ~58 KB | Zero Dependencies | Vanilla JavaScript PWA**
> Updated: May 31, 2026

---

## Changelog

| Ver | Feature | Files Changed | Description |
|-----|---------|---------------|-------------|
| v1.1 | ⏳ **Countdown Timer** | `home.js`, `components.css` | Live per-second countdown badge on each task card; urgent/overdue states |
| v1.1 | ✏️ **Edit Task** | `home.js`, `app.js` | Edit button on cards; reuses create dialog in edit mode; `updateTask()` on submit |
| v1.1 | 🔇 **Disable Notifications** | `settings.js`, `app.js` | Toggle in Settings; cancels all timers; skips scheduling on load/create |
| v1.1 | 🌙 **Dark Mode Default** | `theme.js`, `index.html` | Default theme changed from `'light'` to `'dark'` |
| v1.2 | 🔔 **Notification Timing Fix** | `notifications.js` | Reminders now fire BEFORE due date; last reminder fires AT due time |

**Files changed:** 6 of 22 | **Files untouched:** 16 of 22

---

## 1. Architecture Overview

```
                            ┌───────────────────┐
                            │    index.html      │  ← App Shell
                            │  data-theme="dark" │  ← 🌙 Dark default
                            └─────────┬─────────┘
                                      │ loads
                   ┌──────────────────┼──────────────────┐
                   │                  │                  │
           ┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
           │   CSS Layer   │  │    js/app.js   │  │    sw.js    │
           │   (5 files)   │  │  Orchestrator  │  │  Service    │
           │  +countdown   │  │  +edit task    │  │  Worker     │
           │   styles      │  │  +notif check  │  └─────────────┘
           └───────────────┘  └───────┬───────┘
                                      │ imports
                          ┌───────────┼───────────┐
                          │           │           │
                  ┌───────▼──┐ ┌──────▼─────┐ ┌───▼──────┐
                  │  UTILS   │ │  SERVICES  │ │  PAGES   │
                  │  (2)     │ │  (4)       │ │  (4)     │
                  │ state.js │ │ db.js      │ │ home.js  │
                  │ helpers  │ │ notifs.js  │ │  +countdown
                  │          │ │  🔔 FIXED  │ │  +edit btn
                  │          │ │ theme.js   │ │ settings │
                  │          │ │  🌙 dark   │ │  +notif  │
                  │          │ │ backup.js  │ │  disable │
                  └──────────┘ └────────────┘ └──────────┘
```

---

## 2. Node Catalog — Every File & Function

---

### 🏠 ROOT FILES

#### `index.html` — App Shell (4.7 KB) 🔄 UPDATED
- **Type:** Entry Point
- **Description:** Single HTML page: sticky header, scrollable `<main>`, fixed bottom nav (4 tabs), FAB (+), task creation `<dialog>` (reused for edit), delete confirmation `<dialog>`, toast container.
- **🌙 v1.1 CHANGE:** `data-theme="dark"` (was `"light"`), `meta theme-color` → `#1A1A2E`
- **Key Elements:** `#app`, `#app-content`, `#bottom-nav`, `#fab`, `#task-dialog`, `#confirm-dialog`, `#toast`
- **Connects to:** All CSS files (stylesheet links), `js/app.js` (module script)

#### `manifest.json` — PWA Manifest (0.4 KB)
- **Type:** Configuration
- **Description:** App name ("RemindMe Pro"), theme color (#6C63FF), standalone display, portrait orientation, icon references for PWA installability.

#### `sw.js` — Service Worker (1.3 KB)
- **Type:** Background Worker
- **Description:** Runs independently of main thread. Handles:
  - `install` → Caches all static assets into `remindme-v1` cache
  - `activate` → Cleans old cache versions
  - `fetch` → Cache-first strategy (serve cached, fallback to network)
  - `push` → Shows browser notification with Done/Snooze action buttons
  - `notificationclick` → Posts message to app (`TASK_DONE` or `TASK_SNOOZE`)

#### `README.md` — Documentation (0.5 KB)
- **Type:** Docs
- **Description:** Project overview, feature list, quick start commands.

---

### 🎨 CSS LAYER (5 files)

#### `css/variables.css` — Design Tokens (1.2 KB)
- **Description:** All CSS Custom Properties. Light defaults on `:root`, dark overrides on `[data-theme="dark"]`.
- **Key Tokens:** `--primary` (#6C63FF), `--bg`, `--surface`, `--text`, `--border`, `--priority-low/medium/high/critical`, `--shadow-sm/md/lg`, `--space-xs→xl`, `--radius-sm→full`, `--transition-fast/normal`, `--font-family`, `--primary-light`

#### `css/base.css` — Reset & Typography (1.1 KB)
- **Description:** Box model reset, body defaults, heading sizes (h1=32px→h3=18px), input focus styles with purple ring, range/checkbox accent color.

#### `css/layout.css` — App Structure (1.0 KB)
- **Description:** Flexbox column layout for `#app` (max-width 480px centered), sticky header, scrollable content with bottom padding, fixed bottom nav, responsive breakpoints at 768px and 1024px.
- **Key Classes:** `#app`, `#app-header`, `#app-content`, `#bottom-nav`, `.nav-btn`

#### `css/components.css` — UI Components (7.8 KB) 🔄 UPDATED
- **Description:** Styles for all interactive elements. **v1.1 additions:**

| New Class | Description |
|-----------|-------------|
| `.task-card-header` | Flexbox row: title on left, countdown badge on right |
| `.countdown-badge` | Monospace timer badge, purple background, min-width 100px |
| `.countdown-urgent` | Red color + pulse animation when ≤5 minutes remain |
| `.countdown-overdue` | Red background when task is past due |
| `.toggle-danger` | Red toggle slider for "Disable Notifications" switch |
| `.edit-btn` | Purple-colored edit button |

- **Existing classes:** `.fab`, `dialog`, `.form-group`, `.btn-*`, `.task-card`, `.priority-*`, `.calendar-grid`, `.categories-grid`, `.settings-section`, `.toggle`, `.stats-row`, `.toast`, `.empty-state`

#### `css/animations.css` — Micro-Animations (0.8 KB)
- **Description:** 5 keyframe animations + stagger delays:
  - `fadeIn` — Opacity 0→1 + translateY (page transitions)
  - `slideUp` — translateY 100%→0 (dialog opening)
  - `checkmark` — scale 0→1.2→1 (task completion)
  - `swipeOut` — translateX→-100% + collapse (task deletion)
  - `pulse` — scale 1→1.05→1 infinite (badge + countdown-urgent)
  - `.stagger-1/2/3/4` — Cascading animation delays

---

### ⚙️ JS UTILITIES (2 files) — Unchanged

#### `js/utils/state.js` — Reactive State Store (0.5 KB)
| Export | Description |
|--------|-------------|
| `createStore(initialState)` | Factory: wraps object in `Proxy`; on any property `set`, notifies all subscribed listener functions with `(key, newValue, oldValue)` |
| `store` | Singleton instance: `tasks[]`, `categories[]`, `currentPage`, `theme`, `isOnline` |

- **Pattern:** Observer via Proxy (~10 lines, replaces Redux/Vuex)
- **Used by:** `app.js`

#### `js/utils/helpers.js` — Pure Utility Functions (1.2 KB)
| Export | Description |
|--------|-------------|
| `generateId()` | UUID via `crypto.randomUUID()` with `Date.now()+Math.random()` fallback |
| `formatDate(date)` | Full format: "Mon, 30 May, 03:00 pm" via `Intl.DateTimeFormat` |
| `formatDateShort(date)` | Short format: "30 May, 03:00 pm" |
| `getDateLabel(dateStr)` | Compares to today → returns `"Overdue"` / `"Today"` / `"Tomorrow"` / `"This Week"` / `"Upcoming"` |
| `showToast(msg, duration)` | Shows `#toast` element with message, auto-hides after `duration` ms (default 3000) |
| `getCategoryIcon(category)` | Maps string to emoji: `work→💼`, `health→💊`, `study→📚`, `finance→💰`, `personal→🏠`, `general→📌` |
| `getPriorityLabel(priority)` | Maps to colored label: `critical→🔴 Critical`, `high→🟠 High`, etc. |

- **Dependencies:** None (pure functions)
- **Used by:** `app.js`, `home.js`, `categories.js`, `settings.js`

---

### 🔧 JS SERVICES (4 files)

#### `js/services/db.js` — IndexedDB Data Layer (1.5 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `openDB()` | Opens/creates `RemindMeProDB` v1; creates `tasks` object store with keyPath `id` and indexes on `dueDate`, `priority`, `category`, `status` |
| `addTask(task)` | Inserts task object via `readwrite` transaction → `.add()` |
| `getAllTasks()` | Returns all tasks via `readonly` transaction → `.getAll()` |
| `updateTask(task)` | Upserts task via `readwrite` transaction → `.put()` |
| `deleteTask(id)` | Removes task by id via `readwrite` transaction → `.delete()` |

- **Internal State:** `db` — cached database connection (singleton)
- **Database Schema:**
  ```
  tasks { id(PK), title, description, dueDate(IDX), priority(IDX),
          category(IDX), reminderCount, intervalMs, remindUntilDone,
          maxSnooze, snoozeCount, status(IDX), createdAt, completedAt }
  ```
- **Used by:** `app.js`, all pages, `backup.js`

#### `js/services/notifications.js` — Multi-Fire Engine (6.4 KB) 🔄 MAJOR FIX v1.2
| Export | Description |
|--------|-------------|
| `requestPermission()` | Calls `Notification.requestPermission()`; returns boolean |
| `showNotification(task, count, total)` | Creates browser `Notification` with body "Reminder X of Y"; shows "— DUE NOW!" on last reminder |
| `scheduleMultiFire(task)` | **🔔 FIXED:** Calculates `firstFireTime = dueDate - (count-1) × interval` so reminders fire BEFORE due date and last one fires AT due date. Skips past reminders (>1 min ago) on reload. Separate logic for "Remind Until Done" mode. Logs schedule to console. |
| `cancelReminders(taskId)` | Clears all `setTimeout` handles from `activeTimers` Map |
| `acknowledgeTask(taskId)` | Sets `localStorage(task-ack-{id})=true`; calls `cancelReminders()` |
| `snoozeTask(task, ms)` | Cancels current timers → new dueDate = now + ms → snoozeCount++ → re-schedules; returns updated task |

- **Internal State:** `activeTimers` — `Map<string, number[]>` tracking setTimeout IDs per task
- **v1.2 Fix Detail:**
  ```
  OLD (broken): firstFireTime = dueDate → all reminders fire AFTER deadline
  NEW (fixed):  firstFireTime = dueDate - (count-1) × interval → last fires AT deadline

  Example: Due 3:00 PM, 5 reminders × 15 min
    OLD: 3:00, 3:15, 3:30, 3:45, 4:00 ← all late!
    NEW: 2:00, 2:15, 2:30, 2:45, 3:00 ← last one AT deadline ✅
  ```
- **Used by:** `app.js`, `home.js`, `settings.js`

#### `js/services/theme.js` — Theme Manager (1.0 KB) 🔄 UPDATED v1.1
| Export | Description |
|--------|-------------|
| `getTheme()` | Reads `localStorage('remindme-theme')`; **🌙 default changed to `'dark'`** (was `'light'`) |
| `setTheme(theme)` | Writes to localStorage + sets `document.documentElement.dataset.theme` |
| `toggleTheme()` | Flips dark↔light; returns new theme string |
| `initTheme()` | Applies saved theme on load; listens for `prefers-color-scheme` media query changes |

- **Mechanism:** Setting `data-theme="dark"` on `<html>` activates CSS overrides in `variables.css`
- **Used by:** `app.js`, `settings.js`

#### `js/services/backup.js` — Import/Export & Auto-Backup (5.8 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `exportAsJSON()` | `getAllTasks()` → wraps in `{app, version, exportDate, taskCount, tasks}` → `Blob` → file download |
| `exportAsCSV()` | `getAllTasks()` → 14-column CSV → file download |
| `importFromJSON(file)` | `FileReader.readAsText()` → `JSON.parse()` → validates required fields → returns parsed backup |
| `restoreFromBackup(data, mode)` | `merge`: skips existing IDs. `replace`: deletes all + imports all. Returns `{imported, skipped, replaced}` |
| `autoBackup()` | Saves all tasks to `localStorage('remindme-auto-backups')` as JSON; keeps rolling 3 snapshots |
| `getAutoBackups()` | Returns auto-backup array from localStorage |
| `restoreAutoBackup(index, mode)` | Restores from specific auto-backup by index |
| `isAutoBackupEnabled()` | Checks `localStorage('remindme-auto-backup-enabled')` flag |
| `setAutoBackupEnabled(bool)` | Sets the auto-backup enabled flag |
| `startAutoBackup()` | Starts `setInterval` at 30-min cadence + immediate backup |
| `stopAutoBackup()` | Clears the interval timer |

- **Internal Helpers:** `downloadFile()`, `getDateStamp()`, `esc()` (CSV escaping)
- **Used by:** `app.js`, `settings.js`

---

### 📄 JS PAGES (4 files)

#### `js/pages/home.js` — Home Page / Task List (10.3 KB) 🔄 MAJOR UPDATE v1.1
| Export | Description |
|--------|-------------|
| `renderHome()` | Main view: stats row → date-grouped task cards → action buttons. **3 new features:** |

**⏳ NEW: Countdown Timer**
- Each pending task card shows a live countdown badge: `⏳ 2h 15m 33s`
- `setInterval(updateCountdowns, 1000)` runs every second
- Calculates `dueDate - now` for each `[data-countdown-target]` badge
- States: calm (purple) → urgent ≤5min (red + pulse) → overdue (red "⚠️ OVERDUE")
- Interval cleared on page navigation (prevents memory leaks)

**✏️ NEW: Edit Button**
- Each task card has an `✏️ Edit` button
- Click dispatches `CustomEvent('edit-task', { detail: task })` to app.js
- app.js pre-fills the existing dialog and switches to edit mode

**Existing Features:**
- Stats row (pending / overdue / completed counts)
- Date grouping: Overdue → Today → Tomorrow → This Week → Upcoming
- Task cards with priority left-border, meta info, category badge
- ✅ Done → `updateTask()` + `acknowledgeTask()` + re-render
- 💤 Snooze → snoozeCount++ + new dueDate + re-render
- 🗑️ Delete → confirm dialog → `deleteTask()` + `cancelReminders()`
- Collapsible completed section

**Internal State:** `countdownInterval` — module-level `setInterval` ID

**Imports:** `db.{getAllTasks, updateTask, deleteTask}`, `notifications.{acknowledgeTask, cancelReminders}`, `helpers.{formatDateShort, getDateLabel, showToast, getCategoryIcon}`

#### `js/pages/categories.js` — Categories Page (1.9 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `renderCategories()` | Fetches all tasks → counts per category → renders 2×3 grid of category cards with emoji icons and counts → click handler filters and shows tasks below |

- **Imports:** `db.getAllTasks`, `helpers.getCategoryIcon`

#### `js/pages/calendar.js` — Calendar Page (2.8 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `renderCalendar()` | Fetches tasks → builds month grid (7-col CSS grid) → marks today, days with tasks (dot indicator) → prev/next month navigation → click day to show tasks |

- **Internal State:** `cM` (currentMonth), `cY` (currentYear)
- **Imports:** `db.getAllTasks`

#### `js/pages/settings.js` — Settings Page (11.0 KB) 🔄 UPDATED v1.1
| Export | Description |
|--------|-------------|
| `renderSettings()` | Renders 6 sections with full interactivity: |

**🔇 NEW: Disable Notifications Toggle**
- New toggle at top of Notifications section
- When enabled: cancels ALL active timers via `cancelReminders()` for every task
- Stores flag: `localStorage('remindme-notifications-disabled') = 'true'`
- Greys out browser permission row when disabled
- Status shows "🔇 Disabled by user"

**Existing Sections:**
- **Appearance:** Dark mode toggle switch
- **Notifications:** Enable button + permission status
- **Backup & Restore:** Export JSON/CSV, Import (merge/replace), Auto-backup toggle, backup history with restore
- **Statistics:** Total / pending / completed counts
- **Data Management:** Clear completed, Delete all (auto-backup before delete)
- **About:** Version, author

**Internal Helpers:** `isNotifDisabled()`, `setNotifDisabled(bool)`

**Imports:** `theme.{getTheme, setTheme}`, `db.{getAllTasks, deleteTask}`, `notifications.{requestPermission, cancelReminders}` ← NEW import, `helpers.showToast`, `backup.*` (all 12 exports)

---

### 🚀 `js/app.js` — Main Application Orchestrator (11.8 KB) 🔄 MAJOR UPDATE v1.1

| Function | Description |
|----------|-------------|
| `navigateTo(page)` | Sets active nav button styling; calls page render function from `pages` map |
| **`isNotificationsDisabled()`** | **🔇 NEW v1.1:** Reads `localStorage('remindme-notifications-disabled')` flag |
| `setupTaskForm()` | **✏️ UPDATED v1.1:** Supports CREATE and EDIT modes. Listens for `edit-task` CustomEvent → pre-fills form → changes dialog title to "✏️ Edit Reminder" → on submit calls `updateTask()` instead of `addTask()`. **🔇** Checks `isNotificationsDisabled()` before scheduling |
| `setupNav()` | Attaches click listeners to all 4 `.nav-btn` elements → calls `navigateTo()` |
| `scheduleExisting()` | **🔇 UPDATED v1.1:** Skips entirely if notifications are disabled |
| `setupReminders()` | **🔇 UPDATED v1.1:** Ignores `reminder-fired` events if notifications disabled |
| `registerSW()` | Registers `/sw.js` Service Worker |
| `setupSW()` | Listens for `message` events from SW: `TASK_DONE` → acknowledge + mark completed; `TASK_SNOOZE` → snooze 15 min + update DB |
| `init()` | **🔇 UPDATED v1.1:** Bootstrap: initTheme → openDB → setupNav → setupTaskForm → renderHome → requestPermission (if not disabled) → scheduleExisting → setupReminders → registerSW → setupSW → connectivity → beforeunload auto-backup → startAutoBackup |

**Internal State:** `editingTaskId` — **NEW v1.1:** tracks task ID when in edit mode; `null` for create mode

**Imports:** ALL 4 services, ALL 4 pages, both utils (6 modules total)

---

## 3. Dependency Graph

```
js/app.js (ORCHESTRATOR — imports everything)
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
│    ✏️ dispatches CustomEvent('edit-task') → caught by app.js
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
     ├──▶ notifications.js ── requestPermission, cancelReminders  ← NEW v1.1
     ├──▶ backup.js ──── ALL 12 exports
     └──▶ helpers.js ──── showToast

js/services/backup.js
└──▶ db.js ──────────── getAllTasks, addTask, deleteTask

Leaf modules (zero imports): state.js, helpers.js, db.js, notifications.js, theme.js
```

---

## 4. Data Flow Diagrams

### 4.1 Task Creation Flow
```
User taps [+] FAB
       │
       ▼
task-dialog.showModal()  ← editingTaskId = null (create mode)
       │                    dialogTitle = "New Reminder"
       ▼ user fills form
form 'submit' event
       │
       ▼
Validate: title + date required
       │
       ▼
generateId() → build task object (14 fields)
       │
       ▼
addTask(task) ──→ IndexedDB.tasks.add()
       │
       ▼
🔇 CHECK: isNotificationsDisabled()?
       ├── YES → skip scheduling
       └── NO  → scheduleMultiFire(task) 🔔 FIXED: fires BEFORE due
       │
       ▼
dialog.close() → showToast("✅ Created") → navigateTo('home')
```

### 4.2 ✏️ Edit Task Flow (NEW v1.1)
```
User taps [✏️ Edit] on task card
       │
       ▼
home.js dispatches CustomEvent('edit-task', { detail: task })
       │
       ▼
app.js listener catches event
       │
       ▼
editingTaskId = task.id  (switch to edit mode)
dialogTitle = "✏️ Edit Reminder"
submitBtn = "💾 Update Reminder"
       │
       ▼
Pre-fill ALL form fields from task data:
  title, desc, date, priority, category,
  reminderCount, interval, untilDone, maxSnooze
       │
       ▼
dialog.showModal()
       │
       ▼ user modifies fields
form 'submit' event
       │
       ▼
editingTaskId !== null → EDIT MODE
       │
       ▼
Merge: { ...existingTask, ...formData }
       │
       ▼
updateTask(merged) ──→ IndexedDB.tasks.put()
       │
       ▼
🔇 CHECK → if not disabled → scheduleMultiFire(updated)
       │
       ▼
editingTaskId = null → dialog.close()
showToast("✏️ Updated!") → navigateTo('home')
```

### 4.3 🔔 Multi-Fire Notification Flow (FIXED v1.2)
```
scheduleMultiFire(task)
       │
       ▼
🔇 NOTE: Caller checks isNotificationsDisabled() BEFORE calling
       │
       ├── remindUntilDone === true ──→ UNTIL-DONE MODE
       │     │
       │     ▼
       │   Wait until dueDate → fire reminder 1
       │     │
       │     ▼ every intervalMs:
       │   Check localStorage ack flag
       │     ├── true  → STOP
       │     └── false → fire next reminder → repeat
       │
       └── remindUntilDone === false ──→ NORMAL MODE (FIXED)
             │
             ▼
           Calculate: firstFireTime = dueDate - (count-1) × intervalMs
             │
             ▼
           Example: Due 3:00 PM, 5 reminders × 15 min
             firstFireTime = 3:00 PM - (4 × 15 min) = 2:00 PM
             │
             ▼
           for i = 0 → reminderCount:
             fireTime = firstFireTime + (i × intervalMs)
             delay = fireTime - now
               │
               ├── delay < -60s → SKIP (past, don't spam on reload)
               └── delay ≥ 0   → setTimeout(() => {
                     │
                     ▼
                   Check localStorage('task-ack-{id}')
                     ├── true  → SKIP (acknowledged)
                     └── false →
                         ├── showNotification(task, i+1, total)
                         │   (last one shows "— DUE NOW!")
                         └── dispatch CustomEvent('reminder-fired')
                              → app.js → showToast()
                   }, delay)
             │
             ▼
           Console log: 📅 "Task": 5 reminders from 2:00 PM to 3:00 PM (every 15 min)

  BEFORE FIX:  3:00 → 3:15 → 3:30 → 3:45 → 4:00  ← all AFTER deadline ❌
  AFTER FIX:   2:00 → 2:15 → 2:30 → 2:45 → 3:00  ← last AT deadline ✅
```

### 4.4 ⏳ Countdown Timer Flow (NEW v1.1)
```
renderHome() called
       │
       ▼
Clear previous countdownInterval (if any)
       │
       ▼
Render task cards with:
  <div class="countdown-badge"
       data-countdown-target="{dueDate}"
       id="cd-{taskId}">
    ⏳ --:--:--
  </div>
       │
       ▼
updateCountdowns() — runs immediately
       │
       ▼
setInterval(updateCountdowns, 1000)  ← every second
       │
       ▼
Each tick:
  querySelectorAll('[data-countdown-target]')
    │
    for each badge:
      diff = target - Date.now()
      │
      ├── diff ≤ 0    → "⚠️ OVERDUE"    + .countdown-overdue
      ├── diff > 24h  → "⏳ 3d 5h 20m"  (calm purple)
      ├── diff > 1h   → "⏳ 5h 30m 15s" (calm purple)
      ├── diff ≤ 5min → "⏳ 4m 22s"     + .countdown-urgent (red + pulse)
      └── diff < 1min → "⏳ 45s"        + .countdown-urgent (red + pulse)
```

### 4.5 🔇 Disable Notifications Flow (NEW v1.1)
```
User toggles "Disable All Notifications" in Settings
       │
       ▼
setNotifDisabled(true)
  → localStorage('remindme-notifications-disabled') = 'true'
       │
       ▼
getAllTasks() → for each task: cancelReminders(task.id)
  (clears ALL active setTimeout handles)
       │
       ▼
showToast("🔇 All notifications disabled")
renderSettings() → browser permission row greyed out
       │
       ▼
EFFECTS ON OTHER FLOWS:
  • app.js init()         → skips requestPermission()
  • scheduleExisting()    → skips entirely (no timers set on load)
  • setupTaskForm submit  → skips scheduleMultiFire() on create/edit
  • setupReminders()      → ignores 'reminder-fired' events (no toasts)
  • settings UI           → browser perm row greyed out (pointer-events: none)
       │
       ▼
RE-ENABLE:
  User toggles OFF → setNotifDisabled(false)
  showToast("🔔 Re-enabled — restart app to reschedule")
  On next app load → scheduleExisting() runs normally
```

### 4.6 🌙 Theme Default Flow (UPDATED v1.1)
```
First visit (no localStorage):
       │
       ▼
getTheme() → no saved value → returns 'dark' (was 'light')
       │
       ▼
document.documentElement.dataset.theme = 'dark'
       │
       ▼
CSS [data-theme="dark"] { ... } activates
       │
       ▼
index.html also has data-theme="dark" → no flash of light theme
```

### 4.7 Backup & Restore Flow (unchanged)
```
EXPORT: getAllTasks() → JSON/CSV blob → file download
IMPORT: FileReader → parse → validate → merge|replace → refresh
AUTO:   setInterval(30 min) → localStorage (last 3 snapshots)
```

---

## 5. Storage Map

| Storage Type | Key | Data | Read By | Written By |
|-------------|-----|------|---------|------------|
| **IndexedDB** | `RemindMeProDB → tasks` | All task objects (14-field schema) | db.js → all pages | db.js |
| **localStorage** | `remindme-theme` | `"dark"` (🌙 default) or `"light"` | theme.js | theme.js |
| **localStorage** | `task-ack-{taskId}` | `"true"` when acknowledged | notifications.js | notifications.js |
| **localStorage** | `remindme-auto-backups` | JSON array of last 3 snapshots | backup.js | backup.js |
| **localStorage** | `remindme-auto-backup-enabled` | `"true"` / `"false"` | backup.js | backup.js |
| **localStorage** | `remindme-notifications-disabled` | `"true"` / `"false"` — **🔇 NEW v1.1** | app.js, settings.js | settings.js |
| **Cache API** | `remindme-v1` | Cached HTML, CSS, JS assets | sw.js (fetch) | sw.js (install) |

---

## 6. Event System

| Event | Source | Listener | Action | Ver |
|-------|--------|----------|--------|-----|
| `click` `.nav-btn` | User | `app.js` | `navigateTo(page)` | v1.0 |
| `click` `#fab` | User | `app.js` | Open dialog in CREATE mode | v1.0 |
| **`edit-task`** | **`home.js`** | **`app.js`** | **Open dialog in EDIT mode, pre-fill form** | **v1.1** |
| `submit` `#task-form` | User | `app.js` | Create OR Update task (based on `editingTaskId`) | v1.0→v1.1 |
| `click` `.complete-btn` | User | `home.js` | Mark done → update DB → acknowledge | v1.0 |
| `click` `.snooze-btn` | User | `home.js` | Snooze 15 min → update DB | v1.0 |
| **`click` `.edit-btn`** | **User** | **`home.js`** | **Dispatch `edit-task` event** | **v1.1** |
| `click` `.delete-btn` | User | `home.js` | Confirm → delete from DB | v1.0 |
| `click` `.category-card` | User | `categories.js` | Filter tasks by category | v1.0 |
| `click` `.calendar-day` | User | `calendar.js` | Show tasks for that day | v1.0 |
| `change` `#theme-toggle` | User | `settings.js` | Toggle dark/light mode | v1.0 |
| **`change` `#notif-disable-toggle`** | **User** | **`settings.js`** | **Enable/disable all notifications** | **v1.1** |
| `change` `#import-file` | User | `settings.js` | Parse JSON → merge/replace | v1.0 |
| `reminder-fired` | `notifications.js` | `app.js` | Show in-app toast (🔇 skipped if disabled) | v1.0→v1.1 |
| `message` from SW | `sw.js` | `app.js` | Handle TASK_DONE / TASK_SNOOZE | v1.0 |
| `beforeunload` | Browser | `app.js` | Auto-backup if enabled | v1.0 |
| `online` / `offline` | Browser | `app.js` | Connectivity toast | v1.0 |

---

## 7. Complexity Metrics

| File | Size | Exports | Imports | Complexity | Changes |
|------|------|---------|---------|------------|---------|
| `js/app.js` | 11.8 KB | 0 (entry) | 6 modules | 🔴 High | ✏️ Edit + 🔇 Notif disable |
| `js/pages/settings.js` | 11.0 KB | 1 | 5 modules | 🔴 High | 🔇 Disable toggle |
| `js/pages/home.js` | 10.3 KB | 1 | 3 modules | 🔴 High | ⏳ Countdown + ✏️ Edit |
| `css/components.css` | 7.8 KB | — | — | 🟡 Medium | ⏳ Countdown styles |
| `js/services/notifications.js` | 6.4 KB | 6 | 0 | 🟡 Medium | 🔔 Timing fix |
| `js/services/backup.js` | 5.8 KB | 12 | 1 module | 🟡 Medium | — |
| `index.html` | 4.7 KB | — | — | 🟢 Low | 🌙 Dark default |
| `js/pages/calendar.js` | 2.8 KB | 1 | 1 module | 🟢 Low | — |
| `js/pages/categories.js` | 1.9 KB | 1 | 2 modules | 🟢 Low | — |
| `js/services/db.js` | 1.5 KB | 5 | 0 | 🟢 Low | — |
| `css/variables.css` | 1.2 KB | — | — | 🟢 Low | — |
| `js/utils/helpers.js` | 1.2 KB | 7 | 0 | 🟢 Low | — |
| `css/base.css` | 1.1 KB | — | — | 🟢 Low | — |
| `js/services/theme.js` | 1.0 KB | 4 | 0 | 🟢 Low | 🌙 Dark default |
| `css/layout.css` | 1.0 KB | — | — | 🟢 Low | — |
| `css/animations.css` | 0.8 KB | — | — | 🟢 Low | — |
| `js/utils/state.js` | 0.5 KB | 1 | 0 | 🟢 Low | — |
| `sw.js` | 1.3 KB | 0 (worker) | 0 | 🟢 Low | — |
| `manifest.json` | 0.4 KB | — | — | 🟢 Low | — |
| `README.md` | 0.5 KB | — | — | — | — |

**Totals:** 22 files | ~58 KB | 48 exported functions | 17 event types | 7 storage keys

---

*RemindMe Pro v1.2.0 | 22 files | ~58 KB | Vanilla JS | Zero Dependencies*
*Knowledge Graph updated: May 31, 2026*
