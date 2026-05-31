// ============================================================
// RemindMe Pro — Theme Manager
// UPDATED: Dark mode is now the default theme
// ============================================================

const K = 'remindme-theme';

// CHANGED: Default from 'light' → 'dark'
export const getTheme = () => localStorage.getItem(K) || 'dark';

export const setTheme = (t) => {
    localStorage.setItem(K, t);
    document.documentElement.dataset.theme = t;
};

export const toggleTheme = () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
};

export const initTheme = () => {
    const saved = getTheme();
    document.documentElement.dataset.theme = saved === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : saved;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (getTheme() === 'system') {
            document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
        }
    });
};
