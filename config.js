const SUPABASE_URL = 'https://rmxzkgsnahmalzmovtur.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteHprZ3NuYWhtYWx6bW92dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjIzOTIsImV4cCI6MjA3ODAzODM5Mn0.1UTeKWiKhNAwFt4nY7f_9ap-oAGVAEGGc2nZfFIzi7s';

let supabase;

function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

if (!initSupabase()) {
    document.addEventListener('DOMContentLoaded', () => {
        let attempts = 0;
        const interval = setInterval(() => {
            if (initSupabase() || attempts > 50) {
                clearInterval(interval);
            }
            attempts++;
        }, 100);
    });
}
