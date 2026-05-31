// ============================================================
// RemindMe Pro — Backup & Restore Service
// Export: JSON, CSV | Import: JSON | Auto-Backup: localStorage
// ============================================================
import { getAllTasks, addTask, deleteTask } from './db.js';

const APP_NAME = 'RemindMe Pro';
const APP_VERSION = '1.0.0';
const AUTO_BACKUP_KEY = 'remindme-auto-backups';
const MAX_AUTO_BACKUPS = 3;

// EXPORT JSON
export const exportAsJSON = async () => {
    const tasks = await getAllTasks();
    const backup = { app: APP_NAME, version: APP_VERSION, exportDate: new Date().toISOString(), taskCount: tasks.length, tasks };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    downloadFile(blob, `remindme-backup-${getDateStamp()}.json`);
    return tasks.length;
};

// EXPORT CSV
export const exportAsCSV = async () => {
    const tasks = await getAllTasks();
    if (tasks.length === 0) return 0;
    const headers = ['ID','Title','Description','Due Date','Priority','Category','Reminder Count','Interval (min)','Remind Until Done','Max Snooze','Snooze Count','Status','Created At','Completed At'];
    const rows = tasks.map(t => [t.id, esc(t.title), esc(t.description||''), t.dueDate, t.priority, t.category, t.reminderCount, Math.round((t.intervalMs||900000)/60000), t.remindUntilDone?'Yes':'No', t.maxSnooze, t.snoozeCount||0, t.status, t.createdAt, t.completedAt||'']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `remindme-backup-${getDateStamp()}.csv`);
    return tasks.length;
};

// IMPORT JSON
export const importFromJSON = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.tasks || !Array.isArray(data.tasks)) { reject(new Error('Invalid backup: missing tasks array')); return; }
            const required = ['id','title','dueDate','priority','status'];
            for (const t of data.tasks) { for (const f of required) { if (!t[f]) { reject(new Error(`Invalid task: missing "${f}"`)); return; } } }
            resolve({ app: data.app||'Unknown', version: data.version||'Unknown', exportDate: data.exportDate||'Unknown', taskCount: data.tasks.length, tasks: data.tasks });
        } catch (err) { reject(new Error('Failed to parse: ' + err.message)); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
});

// RESTORE
export const restoreFromBackup = async (backupData, mode = 'merge') => {
    const existing = await getAllTasks();
    const existingIds = new Set(existing.map(t => t.id));
    let imported = 0, skipped = 0, replaced = 0;
    if (mode === 'replace') { for (const t of existing) { await deleteTask(t.id); } replaced = existing.length; }
    for (const task of backupData.tasks) {
        if (mode === 'merge' && existingIds.has(task.id)) { skipped++; continue; }
        const safe = { id:task.id, title:task.title, description:task.description||'', dueDate:task.dueDate, priority:task.priority||'medium', category:task.category||'general', reminderCount:task.reminderCount||3, intervalMs:task.intervalMs||900000, remindUntilDone:task.remindUntilDone||false, maxSnooze:task.maxSnooze||3, snoozeCount:task.snoozeCount||0, status:task.status||'pending', createdAt:task.createdAt||new Date().toISOString(), completedAt:task.completedAt||null };
        try { await addTask(safe); imported++; } catch (e) { skipped++; }
    }
    return { imported, skipped, replaced };
};

// AUTO-BACKUP
export const autoBackup = async () => {
    const tasks = await getAllTasks();
    if (tasks.length === 0) return;
    const backup = { timestamp: new Date().toISOString(), taskCount: tasks.length, tasks };
    let backups = [];
    try { backups = JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]'); } catch(e) { backups = []; }
    backups.unshift(backup);
    backups = backups.slice(0, MAX_AUTO_BACKUPS);
    try { localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups)); return true; } catch(e) { return false; }
};

export const getAutoBackups = () => { try { return JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]'); } catch(e) { return []; } };

export const restoreAutoBackup = async (index, mode = 'replace') => {
    const backups = getAutoBackups();
    if (index < 0 || index >= backups.length) throw new Error('Invalid backup index');
    return restoreFromBackup(backups[index], mode);
};

export const isAutoBackupEnabled = () => localStorage.getItem('remindme-auto-backup-enabled') === 'true';
export const setAutoBackupEnabled = (v) => localStorage.setItem('remindme-auto-backup-enabled', v ? 'true' : 'false');

let autoInterval = null;
export const startAutoBackup = () => { if (autoInterval) clearInterval(autoInterval); if (!isAutoBackupEnabled()) return; autoInterval = setInterval(async () => { await autoBackup(); console.log('Auto-backup saved'); }, 30*60*1000); autoBackup(); };
export const stopAutoBackup = () => { if (autoInterval) { clearInterval(autoInterval); autoInterval = null; } };

function downloadFile(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }
function getDateStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function esc(s) { if (!s) return ''; return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"'+s.replace(/"/g,'""')+'"' : s; }
