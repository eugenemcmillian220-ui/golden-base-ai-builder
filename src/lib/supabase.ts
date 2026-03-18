// Re-export SSR client for browser use
// This provides backwards compatibility with existing code that imports from '@/lib/supabase'
import { getClient } from './supabase/client';

// Export the singleton browser client for client-side use
export const supabase = getClient();

// Type exports for convenience
export type { User, Session } from '@supabase/supabase-js';

// For server-side usage in Server Components or API routes:
// import { createClient } from '@/lib/supabase/server';
// const supabase = await createClient();
