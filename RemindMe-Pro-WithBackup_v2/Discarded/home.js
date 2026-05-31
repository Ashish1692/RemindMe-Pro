import { getAllTasks, updateTask, deleteTask } from '../services/db.js';
import { formatDateShort, getDateLabel, showToast, getCategoryIcon } from '../utils/helpers.js';
import { acknowledgeTask, cancelReminders } from '../services/notifications.js';

export const renderHome = async () => {
    const content = document.getElementById('app-content');
    document.getElementById('app-header').innerHTML = '<h2>RemindMe Pro</h2>';
    let tasks = []; try { tasks = await getAllTasks(); } catch(e) {}
    const pending = tasks.filter(t => t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');
    const overdue = pending.filter(t => new Date(t.dueDate) < new Date());

    if (tasks.length === 0) { content.innerHTML = '<div class="empty-state fade-in"><div class="emoji">✌️</div><h3>No reminders yet!</h3><p>Tap <strong>+</strong> to create your first reminder</p></div>'; return; }

    const groups = {};
    pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    pending.forEach(t => { const l = getDateLabel(t.dueDate); if (!groups[l]) groups[l] = []; groups[l].push(t); });

    let html = `<div class="stats-row fade-in"><div class="stat-card"><div class="stat-number">${pending.length}</div><div class="stat-label">Pending</div></div><div class="stat-card"><div class="stat-number">${overdue.length}</div><div class="stat-label" style="color:var(--danger)">Overdue</div></div><div class="stat-card"><div class="stat-number">${completed.length}</div><div class="stat-label" style="color:var(--success)">Done</div></div></div>`;

    ['Overdue','Today','Tomorrow','This Week','Upcoming'].forEach(label => {
        if (!groups[label]) return;
        html += `<div class="date-group">${label}</div>`;
        groups[label].forEach((task, i) => {
            const isOv = new Date(task.dueDate) < new Date();
            html += `<div class="task-card priority-${task.priority} fade-in stagger-${Math.min(i,4)}"><div class="task-title">${escHtml(task.title)}</div>${task.description?`<div class="task-desc">${escHtml(task.description)}</div>`:''}<div class="task-meta"><span>${isOv?'⚠️':'🕐'} ${formatDateShort(task.dueDate)}</span><span>🔔 ${task.remindUntilDone?'∞':task.reminderCount}x</span><span class="task-badge badge-category">${getCategoryIcon(task.category)} ${task.category}</span>${task.snoozeCount>0?`<span>💤 Snoozed ${task.snoozeCount}x</span>`:''}</div><div class="task-actions"><button class="btn btn-sm btn-primary complete-btn" data-id="${task.id}">✅ Done</button><button class="btn btn-sm btn-secondary snooze-btn" data-id="${task.id}" ${(task.snoozeCount||0)>=task.maxSnooze?'disabled style="opacity:0.4"':''}>💤 Snooze</button><button class="btn btn-sm btn-secondary delete-btn" data-id="${task.id}" style="color:var(--danger)">🗑️</button></div></div>`;
        });
    });

    if (completed.length > 0) {
        html += `<div class="date-group" style="cursor:pointer" id="toggle-completed">✅ Completed (${completed.length}) ▸</div><div id="completed-list" style="display:none">`;
        completed.forEach(t => { html += `<div class="task-card completed priority-${t.priority}"><div class="task-title">${escHtml(t.title)}</div><div class="task-actions"><button class="btn btn-sm btn-secondary delete-btn" data-id="${t.id}" style="color:var(--danger)">🗑️</button></div></div>`; });
        html += '</div>';
    }
    content.innerHTML = html;

    content.querySelectorAll('.complete-btn').forEach(b => b.addEventListener('click', async (e) => { e.stopPropagation(); const t = tasks.find(x => x.id === b.dataset.id); if (t) { t.status='completed'; t.completedAt=new Date().toISOString(); await updateTask(t); acknowledgeTask(t.id); showToast('✅ Completed!'); renderHome(); } }));
    content.querySelectorAll('.snooze-btn').forEach(b => b.addEventListener('click', async (e) => { e.stopPropagation(); const t = tasks.find(x => x.id === b.dataset.id); if (t) { t.snoozeCount=(t.snoozeCount||0)+1; t.dueDate=new Date(Date.now()+900000).toISOString(); await updateTask(t); showToast('💤 Snoozed 15 min'); renderHome(); } }));
    content.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', async (e) => { e.stopPropagation(); const dlg=document.getElementById('confirm-dialog'); const cb=document.getElementById('confirm-delete-btn'); const cc=document.getElementById('confirm-cancel-btn'); dlg.showModal(); cb.onclick=async()=>{await deleteTask(b.dataset.id);cancelReminders(b.dataset.id);dlg.close();showToast('🗑️ Deleted');renderHome()}; cc.onclick=()=>dlg.close(); }));

    const tog = document.getElementById('toggle-completed');
    if (tog) tog.addEventListener('click', () => { const l=document.getElementById('completed-list'); const h=l.style.display==='none'; l.style.display=h?'block':'none'; tog.textContent=`✅ Completed (${completed.length}) ${h?'▾':'▸'}`; });
};
function escHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
export default renderHome;