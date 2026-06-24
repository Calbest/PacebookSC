import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://mbuqfamxkpcjcnhlouhp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idXFmYW14a3BjamNuaGxvdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYxMzcsImV4cCI6MjA5Nzg0MjEzN30.Zl1oKVobCXTsdMWKDO-Ad_OWDCKDcPb2XjEKaJd7TJg'
)
