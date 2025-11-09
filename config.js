import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bhnoauukllcldacmdxzf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobm9hdXVrbGxjbGRhY21keHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTQwNTUsImV4cCI6MjA3ODI5MDA1NX0.r-wmv7QY1aTWuzXCPftZHs9dqKqDmmZ9bds3KH0FDbE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
