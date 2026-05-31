const K='remindme-theme';
export const getTheme=()=>localStorage.getItem(K)||'light';
export const setTheme=(t)=>{localStorage.setItem(K,t);document.documentElement.dataset.theme=t};
export const toggleTheme=()=>{const n=getTheme()==='dark'?'light':'dark';setTheme(n);return n};
export const initTheme=()=>{const s=getTheme();document.documentElement.dataset.theme=s==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):s;window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',(e)=>{if(getTheme()==='system')document.documentElement.dataset.theme=e.matches?'dark':'light'})};