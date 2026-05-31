// ============================================================
// RemindMe Pro — Main Application
// UPDATED: Edit task support + Notification disable check
// ============================================================

import { initTheme } from './services/theme.js';
import { openDB, addTask, getAllTasks, updateTask } from './services/db.js';
import { requestPermission, scheduleMultiFire, snoozeTask, acknowledgeTask } from './services/notifications.js';
import { generateId, showToast } from './utils/helpers.js';
import { store } from './utils/state.js';
import { startAutoBackup, isAutoBackupEnabled, autoBackup } from './services/backup.js';

import { renderHome } from './pages/home.js';
import { renderCategories } from './pages/categories.js';
import { renderCalendar } from './pages/calendar.js';
import { renderSettings } from './pages/settings.js';

// ============================================================
// Page Router
// ============================================================
const pages = { home: renderHome, categories: renderCategories, calendar: renderCalendar, settings: renderSettings };

const navigateTo = (page) => {
    store.state.currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    if (pages[page]) pages[page]();
};

// ============================================================
// NEW: Check if notifications are disabled by user
// ============================================================
const isNotificationsDisabled = () => {
    return localStorage.getItem('remindme-notifications-disabled') === 'true';
};

// ============================================================
// Task Creation & Edit Form
// ============================================================
let editingTaskId = null; // NEW: Track if we're editing

const setupTaskForm = () => {
    const dialog = document.getElementById('task-dialog');
    const form = document.getElementById('task-form');
    const slider = document.getElementById('task-reminders');
    const display = document.getElementById('reminder-count-display');
    const untilDone = document.getElementById('task-until-done');
    const dialogTitle = dialog.querySelector('.dialog-title');
    const submitBtn = form.querySelector('button[type="submit"]');

    // FAB opens dialog in CREATE mode
    document.getElementById('fab').addEventListener('click', () => {
        editingTaskId = null; // NEW: Reset edit mode
        dialogTitle.textContent = 'New Reminder'; // NEW
        submitBtn.textContent = '💾 Save Reminder'; // NEW

        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        document.getElementById('task-date').value = formatLocalDateTime(now);
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'general';
        slider.value = 3;
        display.textContent = '3';
        slider.disabled = false;
        document.getElementById('task-interval').value = '900000';
        untilDone.checked = false;
        document.getElementById('task-snooze-max').value = '3';
        dialog.showModal();
        document.getElementById('task-title').focus();
    });

    // ============================================================
    // NEW: Listen for edit-task event from home.js
    // ============================================================
    document.addEventListener('edit-task', (e) => {
        const task = e.detail;
        editingTaskId = task.id; // Set edit mode
        dialogTitle.textContent = '✏️ Edit Reminder'; // Change title
        submitBtn.textContent = '💾 Update Reminder'; // Change button

        // Pre-fill form with existing task data
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-date').value = formatLocalDateTime(task.dueDate);
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-category').value = task.category;
        slider.value = task.reminderCount;
        display.textContent = task.remindUntilDone ? '∞' : task.reminderCount;
        document.getElementById('task-interval').value = String(task.intervalMs);
        untilDone.checked = task.remindUntilDone;
        slider.disabled = task.remindUntilDone;
        document.getElementById('task-snooze-max').value = String(task.maxSnooze);

        dialog.showModal();
        document.getElementById('task-title').focus();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        editingTaskId = null;
        dialog.close();
    });
    dialog.addEventListener('click', e => {
        if (e.target === dialog) { editingTaskId = null; dialog.close(); }
    });

    slider.addEventListener('input', () => display.textContent = slider.value);
    untilDone.addEventListener('change', () => {
        slider.disabled = untilDone.checked;
        display.textContent = untilDone.checked ? '∞' : slider.value;
    });

    // ============================================================
    // Form submit — CREATE or UPDATE
    // ============================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const dueDate = document.getElementById('task-date').value;
        if (!title || !dueDate) { showToast('⚠️ Fill title and date'); return; }

        const taskData = {
            title,
            description: document.getElementById('task-desc').value.trim(),
            dueDate: new Date(dueDate).toISOString(),
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            reminderCount: parseInt(slider.value),
            intervalMs: parseInt(document.getElementById('task-interval').value),
            remindUntilDone: untilDone.checked,
            maxSnooze: parseInt(document.getElementById('task-snooze-max').value),
        };

        try {
            if (editingTaskId) {
                // ============================================================
                // NEW: UPDATE existing task
                // ============================================================
                const existingTasks = await getAllTasks();
                const existing = existingTasks.find(t => t.id === editingTaskId);
                if (existing) {
                    const updated = { ...existing, ...taskData };
                    await updateTask(updated);

                    // Re-schedule notifications if not disabled
                    if (!isNotificationsDisabled()) {
                        scheduleMultiFire(updated);
                    }

                    dialog.close();
                    editingTaskId = null;
                    showToast('✏️ Reminder updated!');
                    navigateTo('home');
                }
            } else {
                // CREATE new task (original logic)
                const task = {
                    id: generateId(),
                    ...taskData,
                    snoozeCount: 0,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    completedAt: null,
                };
                await addTask(task);

                // NEW: Only schedule if notifications are NOT disabled
                if (!isNotificationsDisabled()) {
                    scheduleMultiFire(task);
                }

                dialog.close();
                showToast('✅ Reminder created!');
                navigateTo('home');
            }
        } catch (err) {
            showToast('❌ Failed: ' + err.message);
        }
    });
};

function formatLocalDateTime(date) {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============================================================
// Navigation
// ============================================================
const setupNav = () => {
    document.querySelectorAll('.nav-btn').forEach(b =>
        b.addEventListener('click', () => navigateTo(b.dataset.page))
    );
};

// ============================================================
// Schedule existing tasks (respects notification disable)
// ============================================================
const scheduleExisting = async () => {
    // NEW: Skip scheduling if notifications are disabled
    if (isNotificationsDisabled()) {
        console.log('⏸️ Notifications disabled — skipping schedule');
        return;
    }
    try {
        const tasks = await getAllTasks();
        tasks.filter(t => t.status !== 'completed').forEach(scheduleMultiFire);
    } catch (e) { console.error(e); }
};

// ============================================================
// In-app reminder alerts
// ============================================================
const setupReminders = () => {
    document.addEventListener('reminder-fired', (e) => {
        // NEW: Check if notifications are disabled
        if (isNotificationsDisabled()) return;
        const { task, count } = e.detail;
        showToast(`🔔 ${task.title} — Reminder ${count}${task.remindUntilDone ? '' : ' of ' + task.reminderCount}`, 5000);
    });
};

// ============================================================
// Service Worker
// ============================================================
const registerSW = async () => {
    if ('serviceWorker' in navigator) {
        try { await navigator.serviceWorker.register('/sw.js'); }
        catch (e) { console.warn('SW failed:', e); }
    }
};

const setupSW = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', async (e) => {
            if (e.data.type === 'TASK_DONE') {
                acknowledgeTask(e.data.taskId);
                const t = (await getAllTasks()).find(x => x.id === e.data.taskId);
                if (t) { t.status = 'completed'; t.completedAt = new Date().toISOString(); await updateTask(t); }
                if (store.state.currentPage === 'home') renderHome();
            }
            if (e.data.type === 'TASK_SNOOZE') {
                const t = (await getAllTasks()).find(x => x.id === e.data.taskId);
                if (t) { const s = snoozeTask(t, 900000); await updateTask(s); }
                if (store.state.currentPage === 'home') renderHome();
            }
        });
    }
};

// ============================================================
// INITIALIZE
// ============================================================
const init = async () => {
    console.log('🚀 RemindMe Pro — Initializing...');
    initTheme();
    await openDB();
    setupNav();
    setupTaskForm();
    navigateTo('home');

    // NEW: Only request permission if notifications are not disabled
    if (!isNotificationsDisabled()) {
        await requestPermission();
    }

    await scheduleExisting();
    setupReminders();
    await registerSW();
    setupSW();

    window.addEventListener('online', () => showToast('🟢 Back online'));
    window.addEventListener('offline', () => showToast('🔴 Offline — still works!'));
    window.addEventListener('beforeunload', () => { if (isAutoBackupEnabled()) autoBackup(); });
    if (isAutoBackupEnabled()) { startAutoBackup(); }

    console.log('✅ RemindMe Pro — Ready!');
};

init().catch(err => {
    console.error(err);
    document.getElementById('app-content').innerHTML = `
        <div class="empty-state">
            <div class="emoji">⚠️</div>
            <h3>Error</h3>
            <p>${err.message}</p>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top:16px;width:auto">Reload</button>
        </div>`;
});
