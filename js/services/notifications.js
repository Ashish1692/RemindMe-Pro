// ============================================================
// RemindMe Pro — Notification Engine
// FIXED: Reminders now fire BEFORE due date, not after
//
// Logic: Last reminder fires AT dueDate.
//        Previous reminders fire at intervals BEFORE dueDate.
//        Example: 5 reminders × 15min interval, due at 3:00 PM
//          → fires at 2:00, 2:15, 2:30, 2:45, 3:00 PM
// ============================================================

export const requestPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
};

export const showNotification = (task, currentCount, totalCount) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
    try {
        const isLast = currentCount === totalCount;
        const body = task.remindUntilDone
            ? `Reminder ${currentCount} (until done)${task.description ? ': ' + task.description : ''}`
            : `Reminder ${currentCount} of ${totalCount}${isLast ? ' — DUE NOW!' : ''}${task.description ? ': ' + task.description : ''}`;
        
        // 1. Play custom sound
        const sound = new Audio('./assets/sounds/reminder.mp3');
        sound.volume = 1;
        sound.play().catch(() => { }); // catch if user hasn't interacted yet
        
        const n = new Notification(task.title, {
            body,
            icon: '/assets/icons/icons8-alarm-96.png',
            tag: `${task.id}-${currentCount}`,
            requireInteraction: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
        return n;
    } catch (e) {
        console.warn('Notification failed:', e);
        return null;
    }
};

// Active timer registry
const activeTimers = new Map();

// ============================================================
// FIXED: scheduleMultiFire
//
// OLD (broken): Wait until dueDate, THEN fire N reminders after it
// NEW (fixed):  Fire N reminders BEFORE dueDate, last one AT dueDate
//
// Calculation:
//   firstFireTime = dueDate - (reminderCount - 1) × intervalMs
//   Each reminder fires at: firstFireTime + (i × intervalMs)
//   So reminder[last] fires exactly at dueDate
//
// Edge cases:
//   - If firstFireTime is in the past → fire those immediately
//   - "Remind Until Done" → fires at dueDate, then every interval after
// ============================================================
export const scheduleMultiFire = (task) => {
    cancelReminders(task.id);

    const now = Date.now();
    const dueTime = new Date(task.dueDate).getTime();
    const timers = [];

    if (task.remindUntilDone) {
        // ── "Remind Until Done" mode ──
        // First reminder fires at dueDate, then keeps repeating
        const startDelay = Math.max(0, dueTime - now);

        const fireUntilDone = (count) => {
            const timer = setTimeout(() => {
                const acked = JSON.parse(localStorage.getItem(`task-ack-${task.id}`) || 'false');
                if (acked) return; // Stop if acknowledged

                showNotification(task, count, '∞');
                document.dispatchEvent(new CustomEvent('reminder-fired', {
                    detail: { task, count }
                }));

                // Schedule next one
                fireUntilDone(count + 1);
            }, count === 1 ? startDelay : task.intervalMs);

            timers.push(timer);
            activeTimers.set(task.id, timers);
        };

        fireUntilDone(1);

    } else {
        // ── Normal multi-fire mode (FIXED) ──
        // Calculate when the FIRST reminder should fire
        // so that the LAST reminder fires exactly at dueDate
        const totalLeadTime = (task.reminderCount - 1) * task.intervalMs;
        const firstFireTime = dueTime - totalLeadTime;

        for (let i = 0; i < task.reminderCount; i++) {
            // Each reminder fires at: firstFireTime + (i × intervalMs)
            const fireTime = firstFireTime + (i * task.intervalMs);
            const delay = fireTime - now;

            if (delay < -60000) {
                // More than 1 minute in the past — skip this one
                // (don't spam user with old reminders on app reload)
                continue;
            }

            const actualDelay = Math.max(0, delay); // Fire immediately if slightly past
            const reminderNumber = i + 1;

            const timer = setTimeout(() => {
                // Check if task was acknowledged
                const acked = JSON.parse(localStorage.getItem(`task-ack-${task.id}`) || 'false');
                if (acked) return;

                showNotification(task, reminderNumber, task.reminderCount);

                // Dispatch in-app event
                document.dispatchEvent(new CustomEvent('reminder-fired', {
                    detail: { task, count: reminderNumber }
                }));
            }, actualDelay);

            timers.push(timer);
        }

        activeTimers.set(task.id, timers);
    }

    // Log schedule for debugging
    if (!task.remindUntilDone) {
        const totalLeadTime = (task.reminderCount - 1) * task.intervalMs;
        const firstFireTime = dueTime - totalLeadTime;
        const firstFireDate = new Date(firstFireTime);
        const dueDate = new Date(dueTime);
        console.log(
            `📅 Scheduled "${task.title}": ${task.reminderCount} reminders ` +
            `from ${firstFireDate.toLocaleTimeString()} to ${dueDate.toLocaleTimeString()} ` +
            `(every ${task.intervalMs / 60000} min)`
        );
    } else {
        console.log(
            `📅 Scheduled "${task.title}": Remind Until Done ` +
            `starting at ${new Date(dueTime).toLocaleTimeString()} ` +
            `(every ${task.intervalMs / 60000} min)`
        );
    }
};

// Cancel all scheduled notifications for a task
export const cancelReminders = (taskId) => {
    const timers = activeTimers.get(taskId);
    if (timers) {
        timers.forEach(t => clearTimeout(t));
        activeTimers.delete(taskId);
    }
};

// Acknowledge a task (stop all future notifications)
export const acknowledgeTask = (taskId) => {
    localStorage.setItem(`task-ack-${taskId}`, 'true');
    cancelReminders(taskId);
};

// Snooze a task
export const snoozeTask = (task, snoozeDurationMs) => {
    cancelReminders(task.id);
    const snoozedTask = {
        ...task,
        dueDate: new Date(Date.now() + snoozeDurationMs).toISOString(),
        snoozeCount: (task.snoozeCount || 0) + 1,
    };
    localStorage.removeItem(`task-ack-${task.id}`);
    scheduleMultiFire(snoozedTask);
    return snoozedTask;
};
