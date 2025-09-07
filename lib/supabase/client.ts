import { createBrowserClient } from "@supabase/ssr"
import { wrapSupabaseWithLogging } from "../supabase-debug"

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: process.env.NODE_ENV === 'development' ? { 'x-debug': 'true' } : {},
      }
    }
  )

  return wrapSupabaseWithLogging(supabase)
}
