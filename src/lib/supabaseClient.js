import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ndxyflcscxbgpelpvrtb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5keHlmbGNzY3hiZ3BlbHB2cnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NDE5ODYsImV4cCI6MjA5OTIxNzk4Nn0.6RhxCyHj-rIPH6hXXoaYRfXi-K6iKnxiy2xVjwODcuc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
