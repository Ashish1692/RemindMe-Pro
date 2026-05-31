# 🧠 RemindMe Pro — Codebase Knowledge Graph

> **22 files | ~58 KB | Zero Dependencies | Vanilla JavaScript PWA**
> v1.2 — Updated May 31, 2026

---

## Changelog — 7 files changed across v1.1 & v1.2

| Feature | Files Changed | Description |
|---------|---------------|-------------|
| ⏳ Countdown Timer | `home.js`, `components.css` | Live per-second countdown badge; urgent/overdue states |
| ✏️ Edit Task | `home.js`, `app.js` | Edit button; reuses dialog in edit mode; `updateTask()` |
| 🔇 Disable Notifications | `settings.js`, `app.js` | Toggle; cancels all timers; skips scheduling |
| 🌙 Dark Mode Default | `theme.js`, `index.html` | Default `'light'` → `'dark'` |
| 🔔 Notification Timing Fix | `notifications.js` | Reminders fire BEFORE due; last fires AT due time |

---

## 1. Architecture

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

## 2. Node Catalog

### 🏠 Root Files

#### `index.html` — App Shell (4.7 KB) 🌙 UPDATED
- App shell: header, `<main>`, bottom nav (4 tabs), FAB, task dialog (create+edit), confirm dialog, toast.
- **v1.1:** `data-theme="dark"` (was `"light"`), `meta theme-color` → `#1A1A2E`

#### `manifest.json` — PWA Config (0.4 KB)
- App name, theme color, standalone display, portrait, icon refs.

#### `sw.js` — Service Worker (1.3 KB)
- Cache assets (cache-first), handle push with Done/Snooze actions, post messages to app.

---

### 🎨 CSS Layer (5 files)

#### `css/variables.css` — Design Tokens (1.2 KB)
- CSS Custom Properties for both themes. `--primary`, `--bg`, `--surface`, `--text`, `--priority-*`, `--primary-light`.

#### `css/base.css` — Reset (1.1 KB)
- Box model reset, body defaults, heading sizes, input focus styles.

#### `css/layout.css` — Structure (1.0 KB)
- Flexbox app shell (480px max), sticky header, fixed bottom nav, responsive breakpoints.

#### `css/components.css` — UI Components (7.8 KB) ⏳ UPDATED
- All component styles. **New classes:**

| New Class | Description |
|-----------|-------------|
| `.task-card-header` | Flex row: title left, countdown right |
| `.countdown-badge` | Monospace timer, purple bg, 100px min |
| `.countdown-urgent` | Red + pulse when ≤5 min |
| `.countdown-overdue` | Red bg when past due |
| `.toggle-danger` | Red slider for disable notif toggle |
| `.edit-btn` | Purple edit button |

#### `css/animations.css` — Motion (0.8 KB)
- fadeIn, slideUp, checkmark, swipeOut, pulse (also used by countdown-urgent), stagger delays.

---

### ⚙️ JS Utilities (unchanged)

#### `js/utils/state.js` — Reactive Store (0.5 KB)
| Export | Description |
|--------|-------------|
| `createStore(init)` | Wraps object in Proxy; notifies listeners on set |
| `store` | Singleton: tasks[], categories[], currentPage, theme, isOnline |

#### `js/utils/helpers.js` — Pure Functions (1.2 KB)
| Export | Description |
|--------|-------------|
| `generateId()` | UUID via crypto.randomUUID() with fallback |
| `formatDate(d)` | Full: "Mon, 30 May, 03:00 pm" |
| `formatDateShort(d)` | Short: "30 May, 03:00 pm" |
| `getDateLabel(d)` | "Overdue" / "Today" / "Tomorrow" / "This Week" / "Upcoming" |
| `showToast(msg, ms)` | Show/hide #toast with auto-dismiss |
| `getCategoryIcon(c)` | work→💼, health→💊, study→📚, finance→💰 |
| `getPriorityLabel(p)` | critical→🔴 Critical, high→🟠 High |

---

### 🔧 JS Services (4 files)

#### `js/services/db.js` — IndexedDB (1.5 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `openDB()` | Open/create DB; tasks store with 4 indexes |
| `addTask(task)` | Insert via readwrite → .add() |
| `getAllTasks()` | Fetch all via readonly → .getAll() |
| `updateTask(task)` | Upsert via readwrite → .put() |
| `deleteTask(id)` | Remove via readwrite → .delete() |

#### `js/services/notifications.js` — Engine (6.4 KB) 🔔 FIXED v1.2
| Export | Description |
|--------|-------------|
| `requestPermission()` | Calls Notification.requestPermission() |
| `showNotification(t,n,total)` | **UPD:** Accepts total; last shows "— DUE NOW!" |
| `scheduleMultiFire(task)` | **FIXED:** `firstFireTime = dueDate - (count-1)×interval`. Normal: N timeouts before due. UntilDone: fire at due then repeat. Skips >1min past. Logs schedule. |
| `cancelReminders(id)` | Clear all setTimeout handles from activeTimers Map |
| `acknowledgeTask(id)` | Set ack flag + cancel timers |
| `snoozeTask(t, ms)` | Cancel → new dueDate → re-schedule; return updated |

**Fix Detail:**
```
BEFORE: 3:00→3:15→3:30→3:45→4:00  ← all AFTER deadline ❌
AFTER:  2:00→2:15→2:30→2:45→3:00  ← last AT deadline ✅
```

#### `js/services/theme.js` — Theme (1.0 KB) 🌙 UPDATED
| Export | Description |
|--------|-------------|
| `getTheme()` | **UPD:** Default now `'dark'` (was `'light'`) |
| `setTheme(t)` | Write localStorage + set data-theme attribute |
| `toggleTheme()` | Flip dark↔light; return new value |
| `initTheme()` | Apply on load + listen for system prefers-color-scheme |

#### `js/services/backup.js` — Backup (5.8 KB) — Unchanged
| Export | Description |
|--------|-------------|
| `exportAsJSON()` | All tasks → JSON blob → file download |
| `exportAsCSV()` | All tasks → 14-col CSV → file download |
| `importFromJSON(file)` | FileReader → parse → validate → return data |
| `restoreFromBackup(d,m)` | merge: skip dupes \| replace: del all + import |
| `autoBackup()` | Save to localStorage (rolling 3 snapshots) |
| `startAutoBackup()` | setInterval(30 min) + immediate backup |
| + 6 more | getAutoBackups, restoreAutoBackup, isAutoBackupEnabled, setAutoBackupEnabled, stopAutoBackup |

---

### 📄 JS Pages (4 files)

#### `js/pages/home.js` — Task List (10.3 KB) ⏳✏️ UPDATED
| Feature | Description |
|---------|-------------|
| ⏳ **Countdown** | setInterval(1s): "⏳ 2h 15m 33s" → urgent ≤5min (red pulse) → "⚠️ OVERDUE" |
| ✏️ **Edit btn** | Dispatches CustomEvent('edit-task') → app.js pre-fills dialog |
| ✅ Complete | updateTask → acknowledgeTask → re-render |
| 💤 Snooze | snoozeCount++ → new dueDate → re-render |
| 🗑️ Delete | Confirm → deleteTask → cancelReminders |

#### `js/pages/categories.js` — Grid (1.9 KB) — Unchanged
- 2×3 category grid with counts. Click to filter tasks below.

#### `js/pages/calendar.js` — Calendar (2.8 KB) — Unchanged
- Monthly 7-col grid. Today highlight, task dots, prev/next nav, day-click detail.

#### `js/pages/settings.js` — Settings (11.0 KB) 🔇 UPDATED
| Feature | Description |
|---------|-------------|
| 🔇 **Disable toggle** | cancelReminders() for ALL tasks; localStorage flag; grey out browser perm |
| 🎨 Dark mode | Toggle → setTheme() |
| 💾 Backup | Export JSON/CSV, Import, Auto-backup, history |
| 🗑️ Data | Clear completed, Delete all (auto-backup first) |

---

### 🚀 `js/app.js` — Orchestrator (11.8 KB) ✏️🔇 UPDATED

| Function | Description |
|----------|-------------|
| `navigateTo(page)` | Set active nav + call page render |
| **`isNotificationsDisabled()`** | **NEW:** Reads localStorage disable flag |
| `setupTaskForm()` | **UPD:** CREATE + EDIT modes. Listens 'edit-task' → pre-fill → updateTask(). Checks notif disabled. |
| `setupNav()` | Wire 4 nav buttons |
| `scheduleExisting()` | **UPD:** Skips if notifications disabled |
| `setupReminders()` | **UPD:** Ignores reminder-fired if disabled |
| `registerSW()` | Register /sw.js |
| `setupSW()` | Handle SW messages: TASK_DONE / TASK_SNOOZE |
| `init()` | **UPD:** Skips requestPermission() if disabled |

---

## 3. Dependency Graph

```
js/app.js (ORCHESTRATOR)
│
├──▶ utils/state.js ─────── store
├──▶ utils/helpers.js ───── generateId, showToast
│
├──▶ services/theme.js ──── initTheme
├──▶ services/db.js ──────── openDB, addTask, getAllTasks, updateTask
├──▶ services/notifications.js ── requestPermission, scheduleMultiFire,
│                                     snoozeTask, acknowledgeTask
├──▶ services/backup.js ──── startAutoBackup, isAutoBackupEnabled, autoBackup
│
├──▶ pages/home.js
│    ├──▶ db.js ──────── getAllTasks, updateTask, deleteTask
│    ├──▶ notifications.js ── acknowledgeTask, cancelReminders
│    └──▶ helpers.js ── formatDateShort, getDateLabel, showToast, getCategoryIcon
│    ✏️ dispatches CustomEvent('edit-task') → caught by app.js
│
├──▶ pages/categories.js
│    ├──▶ db.js ──── getAllTasks
│    └──▶ helpers.js ── getCategoryIcon
│
├──▶ pages/calendar.js
│    └──▶ db.js ──── getAllTasks
│
└──▶ pages/settings.js
     ├──▶ theme.js ─── getTheme, setTheme
     ├──▶ db.js ──────── getAllTasks, deleteTask
     ├──▶ notifications.js ── requestPermission, cancelReminders ← NEW
     ├──▶ backup.js ── ALL 12 exports
     └──▶ helpers.js ── showToast

services/backup.js
└──▶ db.js ──── getAllTasks, addTask, deleteTask

Leaf modules (zero imports): state.js, helpers.js, db.js, notifications.js, theme.js
```

---

## 4. Data Flows

### 🔔 FIXED v1.2: Notification Timing
```
scheduleMultiFire(task)  ← caller checks isNotificationsDisabled() first
  │
  ├── remindUntilDone → Wait until dueDate → fire → repeat until ack
  │
  └── Normal Mode (FIXED):
        firstFireTime = dueDate - (count-1) × intervalMs
        Example: Due 3:00 PM, 5 reminders × 15 min
          firstFireTime = 3:00 - (4 × 15min) = 2:00 PM
        for i = 0→count: setTimeout at firstFireTime + i×interval
          delay < -60s → SKIP | delay ≥ 0 → check ack → notify

        BEFORE: 3:00→3:15→3:30→3:45→4:00 ← all AFTER ❌
        AFTER:  2:00→2:15→2:30→2:45→3:00 ← last AT due ✅
```

### ✏️ Edit Task (NEW v1.1)
```
[✏️ Edit] → CustomEvent('edit-task') → app.js pre-fills dialog
  → EDIT MODE → updateTask() → scheduleMultiFire() if enabled
  → dialog.close() → showToast("✏️ Updated!")
```

### ⏳ Countdown Timer (NEW v1.1)
```
renderHome() → setInterval(1s) → for each badge:
  diff = target - now
  ├── ≤ 0    → "⚠️ OVERDUE" (red)
  ├── > 24h  → "⏳ 3d 5h 20m" (purple)
  ├── > 1h   → "⏳ 5h 30m 15s" (purple)
  ├── ≤ 5min → "⏳ 4m 22s" (red + pulse)
  └── < 1min → "⏳ 45s" (red + pulse)
```

### 🔇 Disable Notifications (NEW v1.1)
```
Toggle ON → localStorage flag → cancelReminders() for ALL tasks
Effects: skip requestPermission, scheduleExisting, scheduleMultiFire, toasts
Toggle OFF → "restart app to reschedule"
```

---

## 5. Storage Map

| Storage | Key | Data | Read By | Written By |
|---------|-----|------|---------|------------|
| IndexedDB | `RemindMeProDB → tasks` | All task objects (14 fields) | db.js | db.js |
| localStorage | `remindme-theme` | "dark" (default) / "light" | theme.js | theme.js |
| localStorage | `task-ack-{taskId}` | "true" when acknowledged | notifications.js | notifications.js |
| localStorage | `remindme-auto-backups` | JSON array (last 3) | backup.js | backup.js |
| localStorage | `remindme-auto-backup-enabled` | "true" / "false" | backup.js | backup.js |
| localStorage | `remindme-notifications-disabled` | "true" / "false" **NEW** | app.js, settings.js | settings.js |
| Cache API | `remindme-v1` | Cached assets | sw.js | sw.js |

---

## 6. Event System (17 events)

| Event | Source | Listener | Action | Ver |
|-------|--------|----------|--------|-----|
| `click` .nav-btn | User | app.js | navigateTo(page) | v1.0 |
| `click` #fab | User | app.js | Open dialog (CREATE) | v1.0 |
| **`edit-task`** | **home.js** | **app.js** | **Open dialog (EDIT)** | **v1.1** |
| `submit` #task-form | User | app.js | Create OR Update | v1.1 |
| `click` .complete-btn | User | home.js | Mark done | v1.0 |
| `click` .snooze-btn | User | home.js | Snooze 15 min | v1.0 |
| **`click` .edit-btn** | **User** | **home.js** | **Dispatch edit-task** | **v1.1** |
| `click` .delete-btn | User | home.js | Confirm → delete | v1.0 |
| `click` .category-card | User | categories | Filter by category | v1.0 |
| `click` .calendar-day | User | calendar | Show day's tasks | v1.0 |
| `change` #theme-toggle | User | settings | Toggle dark/light | v1.0 |
| **`change` #notif-disable** | **User** | **settings** | **Disable all notifs** | **v1.1** |
| `change` #import-file | User | settings | Import backup | v1.0 |
| `reminder-fired` | notifs.js | app.js | Toast (skip if 🔇) | v1.1 |
| `message` from SW | sw.js | app.js | TASK_DONE / SNOOZE | v1.0 |
| `beforeunload` | Browser | app.js | Auto-backup | v1.0 |
| `online`/`offline` | Browser | app.js | Connectivity toast | v1.0 |

---

## 7. Complexity Metrics

| File | Size | Exports | Complexity | Changes |
|------|------|---------|------------|---------|
| `app.js` | 11.8 KB | 0 (entry) | 🔴 High | ✏️🔇 |
| `settings.js` | 11.0 KB | 1 | 🔴 High | 🔇 |
| `home.js` | 10.3 KB | 1 | 🔴 High | ⏳✏️ |
| `components.css` | 7.8 KB | — | 🟡 Med | ⏳ |
| `notifications.js` | 6.4 KB | 6 | 🟡 Med | 🔔 Fix |
| `backup.js` | 5.8 KB | 12 | 🟡 Med | — |
| `index.html` | 4.7 KB | — | 🟢 Low | 🌙 |
| `calendar.js` | 2.8 KB | 1 | 🟢 Low | — |
| `categories.js` | 1.9 KB | 1 | 🟢 Low | — |
| `db.js` | 1.5 KB | 5 | 🟢 Low | — |
| `theme.js` | 1.0 KB | 4 | 🟢 Low | 🌙 |
| + 9 more files | ~7 KB | — | 🟢 Low | — |

**Totals:** 22 files | ~58 KB | 48 exports | 17 events | 7 storage keys

---

*RemindMe Pro v1.2 · Knowledge Graph · May 31, 2026 · Ashish Moghe*
