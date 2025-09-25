import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

// Create a single supabase client for interacting with your database
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    // We are using the service_role key, so we can disable auto-refreshing the token.
    autoRefreshToken: false,
    persistSession: false,
  }
});
