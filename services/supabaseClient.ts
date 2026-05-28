import { createClient, SupabaseClient } from '@supabase/supabase-js';

// In production build: injected by esbuild define.
// In CDN dev mode: set window.__SUPABASE_URL__ / window.__SUPABASE_ANON_KEY__ in index.html.
const supabaseUrl: string =
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  ((typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) ?? '');

const supabaseAnonKey: string =
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  ((typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) ?? '');

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

// supabase is null when credentials are not configured (local-only mode)
export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
