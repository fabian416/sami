/**
 * Supabase service client for backend (Service Role key).
 * Only used server-side. Do NOT expose this key to clients.
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
