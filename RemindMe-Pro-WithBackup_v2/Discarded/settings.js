import { getTheme, setTheme } from '../services/theme.js';
import { getAllTasks, deleteTask } from '../services/db.js';
import { requestPermission } from '../services/notifications.js';
import { showToast } from '../utils/helpers.js';
import { exportAsJSON, exportAsCSV, importFromJSON, restoreFromBackup, autoBackup, getAutoBackups, restoreAutoBackup, isAutoBackupEnabled, setAutoBackupEnabled, startAutoBackup, stopAutoBackup } from '../services/backup.js';

export const renderSettings = async () => {
    const content = document.getElementById('app-content');
    document.getElementById('app-header').innerHTML = '<h2>Settings</h2>';
    const isDark = getTheme() === 'dark';
    let tasks = []; try { tasks = await getAllTasks(); } catch(e) {}
    const autoOn = isAutoBackupEnabled();
    const autoBackups = getAutoBackups();

    content.innerHTML = `<div class="fade-in">
        <div class="settings-section"><h3>🎨 Appearance</h3>
            <div class="setting-item"><div><div class="setting-label">Dark Mode</div><div class="setting-desc">Switch between light and dark theme</div></div><label class="toggle"><input type="checkbox" id="theme-toggle" ${isDark?'checked':''}><span class="toggle-slider"></span></label></div>
        </div>

        <div class="settings-section"><h3>🔔 Notifications</h3>
            <div class="setting-item"><div><div class="setting-label">Enable Notifications</div><div class="setting-desc">Allow browser push notifications</div></div><button class="btn btn-sm btn-primary" id="enable-notif-btn">Enable</button></div>
            <div class="setting-item"><div class="setting-label">Status</div><div id="notif-status">${typeof Notification!=='undefined'?Notification.permission:'Not supported'}</div></div>
        </div>

        <div class="settings-section"><h3>💾 Backup & Restore</h3>
            <div class="setting-item"><div><div class="setting-label">Export as JSON</div><div class="setting-desc">Full backup — can be re-imported later</div></div><button class="btn btn-sm btn-primary" id="export-json-btn">📤 Export</button></div>
            <div class="setting-item"><div><div class="setting-label">Export as CSV</div><div class="setting-desc">Open in Excel or Google Sheets</div></div><button class="btn btn-sm btn-secondary" id="export-csv-btn">📤 CSV</button></div>
            <div class="setting-item"><div><div class="setting-label">Import Backup</div><div class="setting-desc">Restore from a .json backup file</div></div><button class="btn btn-sm btn-primary" id="import-btn">📥 Import</button><input type="file" id="import-file" accept=".json" style="display:none"></div>
            <div class="setting-item"><div><div class="setting-label">Auto-Backup</div><div class="setting-desc">Save every 30 minutes automatically</div></div><label class="toggle"><input type="checkbox" id="auto-backup-toggle" ${autoOn?'checked':''}><span class="toggle-slider"></span></label></div>
            ${autoBackups.length>0?`<div style="margin-top:12px;padding:12px;background:var(--surface-hover);border-radius:var(--radius-sm)"><div class="setting-label" style="margin-bottom:8px">📋 Auto-Backup History</div>${autoBackups.map((b,i)=>`<div class="setting-item" style="padding:8px 0"><div><div class="setting-label" style="font-size:13px">${fmtDate(b.timestamp)}</div><div class="setting-desc">${b.taskCount} reminder${b.taskCount!==1?'s':''}</div></div><button class="btn btn-sm btn-secondary restore-auto-btn" data-index="${i}">Restore</button></div>`).join('')}</div>`:''}
        </div>

        <div class="settings-section"><h3>📊 Statistics</h3>
            <div class="setting-item"><div class="setting-label">Total</div><div>${tasks.length}</div></div>
            <div class="setting-item"><div class="setting-label">Pending</div><div>${tasks.filter(t=>t.status!=='completed').length}</div></div>
            <div class="setting-item"><div class="setting-label">Completed</div><div>${tasks.filter(t=>t.status==='completed').length}</div></div>
        </div>

        <div class="settings-section"><h3>🗑️ Data</h3>
            <div class="setting-item"><div><div class="setting-label">Clear Completed</div><div class="setting-desc">Remove completed reminders</div></div><button class="btn btn-sm btn-secondary" id="clear-btn">Clear</button></div>
            <div class="setting-item"><div><div class="setting-label">Delete All</div><div class="setting-desc" style="color:var(--danger)">Cannot be undone!</div></div><button class="btn btn-sm btn-danger" id="delete-all-btn">Delete All</button></div>
        </div>

        <div class="settings-section"><h3>ℹ️ About</h3>
            <div class="setting-item"><div class="setting-label">RemindMe Pro</div><div>v1.0.0</div></div>
            <div class="setting-item"><div class="setting-label">Built with</div><div>Vanilla JS</div></div>
            <div class="setting-item"><div class="setting-label">Author</div><div>Ashish Moghe</div></div>
        </div>
    </div>`;

    // Theme
    document.getElementById('theme-toggle').addEventListener('change', e => { setTheme(e.target.checked?'dark':'light'); showToast(e.target.checked?'🌙 Dark mode':'☀️ Light mode'); });

    // Notifications
    document.getElementById('enable-notif-btn').addEventListener('click', async () => { const g=await requestPermission(); document.getElementById('notif-status').textContent=g?'granted':'denied'; showToast(g?'🔔 Enabled!':'❌ Denied'); });

    // Export JSON
    document.getElementById('export-json-btn').addEventListener('click', async () => { try { const c=await exportAsJSON(); showToast(`📤 Exported ${c} reminders as JSON`); } catch(e) { showToast('❌ '+e.message); } });

    // Export CSV
    document.getElementById('export-csv-btn').addEventListener('click', async () => { try { const c=await exportAsCSV(); showToast(c===0?'⚠️ No reminders':'📤 Exported as CSV'); } catch(e) { showToast('❌ '+e.message); } });

    // Import
    const fileInput = document.getElementById('import-file');
    document.getElementById('import-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try {
            const data = await importFromJSON(file);
            const mode = confirm(`Found ${data.taskCount} reminders from ${fmtDate(data.exportDate)}.\n\nOK = Merge (keep existing + add new)\nCancel = Replace All`) ? 'merge' : 'replace';
            if (mode === 'replace' && !confirm('Replace ALL current data with backup?')) { fileInput.value=''; return; }
            const r = await restoreFromBackup(data, mode);
            showToast(`📥 Imported ${r.imported}, skipped ${r.skipped}${r.replaced?' (replaced '+r.replaced+')':''}`);
            fileInput.value=''; renderSettings();
        } catch(err) { showToast('❌ '+err.message); fileInput.value=''; }
    });

    // Auto-backup toggle
    document.getElementById('auto-backup-toggle').addEventListener('change', e => { setAutoBackupEnabled(e.target.checked); if(e.target.checked){startAutoBackup();showToast('🔄 Auto-backup ON')}else{stopAutoBackup();showToast('Auto-backup OFF')} });

    // Restore from auto-backup
    document.querySelectorAll('.restore-auto-btn').forEach(b => b.addEventListener('click', async () => {
        if(confirm('Replace all data with this backup?')){try{const r=await restoreAutoBackup(parseInt(b.dataset.index),'replace');showToast(`📥 Restored ${r.imported} reminders`);renderSettings()}catch(e){showToast('❌ '+e.message)}}
    }));

    // Clear completed
    document.getElementById('clear-btn').addEventListener('click', async () => { const c=tasks.filter(t=>t.status==='completed'); if(c.length===0){showToast('Nothing to clear');return} for(const t of c)await deleteTask(t.id); showToast(`🗑️ Cleared ${c.length}`); renderSettings(); });

    // Delete all
    document.getElementById('delete-all-btn').addEventListener('click', async () => { if(confirm('Delete ALL reminders?')){await autoBackup();for(const t of tasks)await deleteTask(t.id);showToast('🗑️ All deleted (auto-backup saved)');renderSettings()} });
};

function fmtDate(d){try{return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(d))}catch(e){return d}}
export default renderSettings;