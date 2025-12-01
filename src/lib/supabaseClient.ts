import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfpxwfrvkoqyrvypqtve.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcHh3ZnJ2a29xeXJ2eXBxdHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDk1NDMsImV4cCI6MjA3OTQ4NTU0M30.PNj7AtyS21aapnJWgEFsSRUlZPVaqQcdHfE089DB0Ic'

export const supabase = createClient(supabaseUrl, supabaseKey)
