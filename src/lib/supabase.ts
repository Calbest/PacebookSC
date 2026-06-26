import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://mbuqfamxkpcjcnhlouhp.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idXFmYW14a3BjamNuaGxvdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYxMzcsImV4cCI6MjA5Nzg0MjEzN30.Zl1oKVobCXTsdMWKDO-Ad_OWDCKDcPb2XjEKaJd7TJg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Sessions expire after 1 hour of inactivity
    storageKey: 'sw_session',
  },
})
