import { getAllTasks } from '../services/db.js';
import { getCategoryIcon } from '../utils/helpers.js';
export const renderCategories = async () => {
    const content = document.getElementById('app-content');
    document.getElementById('app-header').innerHTML = '<h2>Categories</h2>';
    let tasks = []; try { tasks = await getAllTasks(); } catch(e) {}
    const pending = tasks.filter(t => t.status !== 'completed');
    const cats = ['general','work','personal','health','study','finance'];
    const counts = {}; cats.forEach(c => counts[c]=0); pending.forEach(t => { if(counts[t.category]!==undefined) counts[t.category]++; });
    let html = '<div class="categories-grid fade-in">';
    cats.forEach(c => { html += `<div class="category-card" data-category="${c}"><div class="category-icon">${getCategoryIcon(c)}</div><div class="category-name">${c.charAt(0).toUpperCase()+c.slice(1)}</div><div class="category-count">${counts[c]} reminder${counts[c]!==1?'s':''}</div></div>`; });
    html += '</div><div id="category-tasks" style="margin-top:20px"></div>';
    content.innerHTML = html;
    content.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            const ct = pending.filter(t => t.category === cat);
            const div = document.getElementById('category-tasks');
            if (ct.length === 0) { div.innerHTML = `<div class="empty-state fade-in"><p>No reminders in ${cat}</p></div>`; return; }
            let h = `<div class="date-group">${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase()+cat.slice(1)} Tasks</div>`;
            ct.forEach(t => { h += `<div class="task-card priority-${t.priority} fade-in"><div class="task-title">${t.title}</div><div class="task-meta"><span>🔔 ${t.reminderCount}x</span></div></div>`; });
            div.innerHTML = h;
        });
    });
};
export default renderCategories;