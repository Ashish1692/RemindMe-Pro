import { getAllTasks } from '../services/db.js';
let cM = new Date().getMonth(), cY = new Date().getFullYear();
export const renderCalendar = async () => {
    const content = document.getElementById('app-content');
    document.getElementById('app-header').innerHTML = '<h2>Calendar</h2>';
    let tasks = []; try { tasks = await getAllTasks(); } catch(e) {}
    const render = () => {
        const mn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const fd = new Date(cY,cM,1).getDay(), dim = new Date(cY,cM+1,0).getDate(), dpm = new Date(cY,cM,0).getDate();
        const today = new Date();
        const taskDays = new Set();
        tasks.filter(t=>t.status!=='completed').forEach(t=>{const d=new Date(t.dueDate);if(d.getMonth()===cM&&d.getFullYear()===cY)taskDays.add(d.getDate())});
        let html = `<div class="calendar-nav fade-in"><button id="prev-m">◀</button><h3>${mn[cM]} ${cY}</h3><button id="next-m">▶</button></div><div class="calendar-grid fade-in">`;
        dn.forEach(d=>{html+=`<div class="calendar-header">${d}</div>`});
        for(let i=fd-1;i>=0;i--)html+=`<div class="calendar-day other-month">${dpm-i}</div>`;
        for(let d=1;d<=dim;d++){const isT=d===today.getDate()&&cM===today.getMonth()&&cY===today.getFullYear();html+=`<div class="calendar-day ${isT?'today':''} ${taskDays.has(d)?'has-tasks':''}" data-day="${d}">${d}</div>`}
        const rem=(fd+dim)%7===0?0:7-(fd+dim)%7;for(let i=1;i<=rem;i++)html+=`<div class="calendar-day other-month">${i}</div>`;
        html+='</div><div id="day-tasks" style="margin-top:16px"></div>';
        content.innerHTML=html;
        document.getElementById('prev-m').addEventListener('click',()=>{cM--;if(cM<0){cM=11;cY--}render()});
        document.getElementById('next-m').addEventListener('click',()=>{cM++;if(cM>11){cM=0;cY++}render()});
        content.querySelectorAll('.calendar-day:not(.other-month)').forEach(el=>{el.addEventListener('click',()=>{const day=parseInt(el.dataset.day);const dt=tasks.filter(t=>{const d=new Date(t.dueDate);return d.getDate()===day&&d.getMonth()===cM&&d.getFullYear()===cY&&t.status!=='completed'});const div=document.getElementById('day-tasks');if(dt.length===0){div.innerHTML='<div class="empty-state" style="padding:20px"><p>No reminders this day</p></div>'}else{let h=`<div class="date-group">${dt.length} reminder${dt.length>1?'s':''} on ${day} ${mn[cM].slice(0,3)}</div>`;dt.forEach(t=>{h+=`<div class="task-card priority-${t.priority} fade-in"><div class="task-title">${t.title}</div><div class="task-meta"><span>🔔 ${t.reminderCount}x</span></div></div>`});div.innerHTML=h}})});
    };
    render();
};
export default renderCalendar;