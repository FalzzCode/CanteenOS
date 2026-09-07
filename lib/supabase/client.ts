import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const demoModeEnabled = String(import.meta.env.VITE_DEMO_MODE ?? "").toLowerCase() === "true";

// Demo mode is an explicit local opt-in. Without it, a configured Supabase
// project remains the source of truth for authentication and authorization.
export const isSupabaseConfigured = !demoModeEnabled && Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
