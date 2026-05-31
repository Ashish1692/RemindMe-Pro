// ============================================================
// RemindMe Pro — Home Page
// UPDATED: Live countdown timers on each task + Edit button
// ============================================================

import { getAllTasks, updateTask, deleteTask } from '../services/db.js';
import { formatDateShort, getDateLabel, showToast, getCategoryIcon } from '../utils/helpers.js';
import { acknowledgeTask, cancelReminders } from '../services/notifications.js';

let countdownInterval = null; // Global interval for all countdowns

export const renderHome = async () => {
    const content = document.getElementById('app-content');
    document.getElementById('app-header').innerHTML = '<h2>RemindMe Pro</h2>';

    // Clear previous countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    let tasks = [];
    try { tasks = await getAllTasks(); } catch (e) { console.error(e); }

    const pending = tasks.filter(t => t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');
    const overdue = pending.filter(t => new Date(t.dueDate) < new Date());

    if (tasks.length === 0) {
        content.innerHTML = `
            <div class="empty-state fade-in">
                <div class="emoji">✌️</div>
                <h3>No reminders yet!</h3>
                <p>Tap <strong>+</strong> to create your first reminder</p>
            </div>`;
        return;
    }

    // Group by date label
    const groups = {};
    pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    pending.forEach(t => {
        const label = getDateLabel(t.dueDate);
        if (!groups[label]) groups[label] = [];
        groups[label].push(t);
    });

    let html = `
        <div class="stats-row fade-in">
            <div class="stat-card"><div class="stat-number">${pending.length}</div><div class="stat-label">Pending</div></div>
            <div class="stat-card"><div class="stat-number">${overdue.length}</div><div class="stat-label" style="color:var(--danger)">Overdue</div></div>
            <div class="stat-card"><div class="stat-number">${completed.length}</div><div class="stat-label" style="color:var(--success)">Done</div></div>
        </div>`;

    const groupOrder = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Upcoming'];
    groupOrder.forEach(label => {
        if (!groups[label]) return;
        html += `<div class="date-group">${label}</div>`;
        groups[label].forEach((task, i) => {
            const isOverdue = new Date(task.dueDate) < new Date();
            html += `
                <div class="task-card priority-${task.priority} fade-in stagger-${Math.min(i, 4)}" data-task-id="${task.id}">
                    <div class="task-card-header">
                        <div class="task-title">${escHtml(task.title)}</div>
                        <!-- NEW: Countdown Timer Badge -->
                        <div class="countdown-badge ${isOverdue ? 'countdown-overdue' : ''}" data-countdown-target="${task.dueDate}" id="cd-${task.id}">
                            ${isOverdue ? '⚠️ OVERDUE' : '⏳ --:--:--'}
                        </div>
                    </div>
                    ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span>${isOverdue ? '⚠️' : '🕐'} ${formatDateShort(task.dueDate)}</span>
                        <span>🔔 ${task.remindUntilDone ? '∞' : task.reminderCount}x</span>
                        <span class="task-badge badge-category">${getCategoryIcon(task.category)} ${task.category}</span>
                        ${task.snoozeCount > 0 ? `<span>💤 Snoozed ${task.snoozeCount}x</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-primary complete-btn" data-id="${task.id}">✅ Done</button>
                        <button class="btn btn-sm btn-secondary snooze-btn" data-id="${task.id}" ${(task.snoozeCount || 0) >= task.maxSnooze ? 'disabled style="opacity:0.4"' : ''}>💤 Snooze</button>
                        <!-- NEW: Edit Button -->
                        <button class="btn btn-sm btn-secondary edit-btn" data-id="${task.id}">✏️ Edit</button>
                        <button class="btn btn-sm btn-secondary delete-btn" data-id="${task.id}" style="color:var(--danger)">🗑️</button>
                    </div>
                </div>`;
        });
    });

    // Completed section (collapsible)
    if (completed.length > 0) {
        html += `<div class="date-group" style="cursor:pointer" id="toggle-completed">✅ Completed (${completed.length}) ▸</div>`;
        html += `<div id="completed-list" style="display:none">`;
        completed.forEach(task => {
            html += `
                <div class="task-card completed priority-${task.priority}">
                    <div class="task-title">${escHtml(task.title)}</div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-secondary delete-btn" data-id="${task.id}" style="color:var(--danger)">🗑️ Remove</button>
                    </div>
                </div>`;
        });
        html += `</div>`;
    }

    content.innerHTML = html;

    // ============================================================
    // NEW: Start countdown timer (updates every second)
    // ============================================================
    const updateCountdowns = () => {
        const badges = content.querySelectorAll('[data-countdown-target]');
        const now = Date.now();
        badges.forEach(badge => {
            const target = new Date(badge.dataset.countdownTarget).getTime();
            const diff = target - now;

            if (diff <= 0) {
                badge.textContent = '⚠️ OVERDUE';
                badge.classList.add('countdown-overdue');
                return;
            }

            badge.classList.remove('countdown-overdue');
            const days = Math.floor(diff / 86400000);
            const hrs = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            if (days > 0) {
                badge.textContent = `⏳ ${days}d ${hrs}h ${mins}m`;
            } else if (hrs > 0) {
                badge.textContent = `⏳ ${hrs}h ${mins}m ${secs}s`;
            } else if (mins > 0) {
                badge.textContent = `⏳ ${mins}m ${secs}s`;
                if (mins <= 5) badge.classList.add('countdown-urgent');
            } else {
                badge.textContent = `⏳ ${secs}s`;
                badge.classList.add('countdown-urgent');
            }
        });
    };

    // Run immediately + every second
    updateCountdowns();
    countdownInterval = setInterval(updateCountdowns, 1000);

    // ============================================================
    // Complete button handler
    // ============================================================
    content.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const task = tasks.find(t => t.id === btn.dataset.id);
            if (task) {
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
                await updateTask(task);
                acknowledgeTask(task.id);
                showToast('✅ Reminder completed!');
                renderHome();
            }
        });
    });

    // ============================================================
    // Snooze button handler
    // ============================================================
    content.querySelectorAll('.snooze-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const task = tasks.find(t => t.id === btn.dataset.id);
            if (task) {
                task.snoozeCount = (task.snoozeCount || 0) + 1;
                task.dueDate = new Date(Date.now() + 900000).toISOString();
                await updateTask(task);
                showToast('💤 Snoozed for 15 minutes');
                renderHome();
            }
        });
    });

    // ============================================================
    // NEW: Edit button handler — dispatches custom event to app.js
    // ============================================================
    content.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = btn.dataset.id;
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                document.dispatchEvent(new CustomEvent('edit-task', { detail: task }));
            }
        });
    });

    // ============================================================
    // Delete button handler
    // ============================================================
    content.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const dlg = document.getElementById('confirm-dialog');
            const confirmBtn = document.getElementById('confirm-delete-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            dlg.showModal();
            confirmBtn.onclick = async () => {
                await deleteTask(btn.dataset.id);
                cancelReminders(btn.dataset.id);
                dlg.close();
                showToast('🗑️ Reminder deleted');
                renderHome();
            };
            cancelBtn.onclick = () => dlg.close();
        });
    });

    // Toggle completed section
    const toggleBtn = document.getElementById('toggle-completed');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const list = document.getElementById('completed-list');
            const isHidden = list.style.display === 'none';
            list.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = `✅ Completed (${completed.length}) ${isHidden ? '▾' : '▸'}`;
        });
    }
};

function escHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default renderHome;
