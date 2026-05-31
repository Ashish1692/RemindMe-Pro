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

const pages = { home: renderHome, categories: renderCategories, calendar: renderCalendar, settings: renderSettings };

const navigateTo = (page) => {
    store.state.currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    if (pages[page]) pages[page]();
};

const setupTaskForm = () => {
    const dialog = document.getElementById('task-dialog');
    const form = document.getElementById('task-form');
    const slider = document.getElementById('task-reminders');
    const display = document.getElementById('reminder-count-display');
    const untilDone = document.getElementById('task-until-done');

    document.getElementById('fab').addEventListener('click', () => {
        const now = new Date(); now.setHours(now.getHours()+1); now.setMinutes(0);
        document.getElementById('task-date').value = now.toISOString().slice(0,16);
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'general';
        slider.value = 3; display.textContent = '3'; slider.disabled = false;
        document.getElementById('task-interval').value = '900000';
        untilDone.checked = false;
        document.getElementById('task-snooze-max').value = '3';
        dialog.showModal();
        document.getElementById('task-title').focus();
    });

    document.getElementById('cancel-btn').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    slider.addEventListener('input', () => display.textContent = slider.value);
    untilDone.addEventListener('change', () => { slider.disabled = untilDone.checked; display.textContent = untilDone.checked ? '∞' : slider.value; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const dueDate = document.getElementById('task-date').value;
        if (!title || !dueDate) { showToast('⚠️ Fill title and date'); return; }

        const task = {
            id: generateId(), title,
            description: document.getElementById('task-desc').value.trim(),
            dueDate: new Date(dueDate).toISOString(),
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            reminderCount: parseInt(slider.value),
            intervalMs: parseInt(document.getElementById('task-interval').value),
            remindUntilDone: untilDone.checked,
            maxSnooze: parseInt(document.getElementById('task-snooze-max').value),
            snoozeCount: 0, status: 'pending',
            createdAt: new Date().toISOString(), completedAt: null,
        };

        try { await addTask(task); scheduleMultiFire(task); dialog.close(); showToast('✅ Reminder created!'); navigateTo('home'); }
        catch (err) { showToast('❌ Failed: ' + err.message); }
    });
};

const setupNav = () => document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => navigateTo(b.dataset.page)));

const scheduleExisting = async () => { try { const t = await getAllTasks(); t.filter(x=>x.status!=='completed').forEach(scheduleMultiFire); } catch(e) {} };

const setupReminders = () => document.addEventListener('reminder-fired', e => {
    const { task, count } = e.detail;
    showToast(`🔔 ${task.title} — Reminder ${count}${task.remindUntilDone?'':' of '+task.reminderCount}`, 5000);
});

const registerSW = async () => { if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('/sw.js'); } catch(e) {} } };

const setupSW = () => { if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', async e => {
    if (e.data.type==='TASK_DONE') { acknowledgeTask(e.data.taskId); const t=(await getAllTasks()).find(x=>x.id===e.data.taskId); if(t){t.status='completed';t.completedAt=new Date().toISOString();await updateTask(t)} if(store.state.currentPage==='home')renderHome(); }
    if (e.data.type==='TASK_SNOOZE') { const t=(await getAllTasks()).find(x=>x.id===e.data.taskId); if(t){const s=snoozeTask(t,900000);await updateTask(s)} if(store.state.currentPage==='home')renderHome(); }
}); };

const init = async () => {
    console.log('🚀 RemindMe Pro — Initializing...');
    initTheme(); await openDB(); setupNav(); setupTaskForm(); navigateTo('home');
    await requestPermission(); await scheduleExisting(); setupReminders();
    await registerSW(); setupSW();
    window.addEventListener('online', () => showToast('🟢 Back online'));
    window.addEventListener('offline', () => showToast('🔴 Offline — still works!'));
    window.addEventListener('beforeunload', () => { if (isAutoBackupEnabled()) autoBackup(); });
    if (isAutoBackupEnabled()) { startAutoBackup(); console.log('🔄 Auto-backup ON'); }
    console.log('✅ RemindMe Pro — Ready!');
};

init().catch(err => { console.error(err); document.getElementById('app-content').innerHTML = `<div class="empty-state"><div class="emoji">⚠️</div><h3>Error</h3><p>${err.message}</p><button class="btn btn-primary" onclick="location.reload()" style="margin-top:16px;width:auto">Reload</button></div>`; });
