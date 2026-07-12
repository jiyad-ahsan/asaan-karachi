// Supabase connection config (public/publishable key — safe for client-side use)
const SUPABASE_URL = "https://qfblxaoudbtgvxmnxgee.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmx4YW91ZGJ0Z3Z4bW54Z2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzU0MTYsImV4cCI6MjA5OTM1MTQxNn0.DGOsOGSDItGPYXAwsVhsoqkKgSgq5RQZug3AZV98ABg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
