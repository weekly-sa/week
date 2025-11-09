import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ugbhzggjxvsfsxxzlcaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteHprZ3NuYWhtYWx6bW92dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjIzOTIsImV4cCI6MjA3ODAzODM5Mn0.1UTeKWiKhNAwFt4nY7f_9ap-oAGVAEGGc2nZfFIzi7s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
