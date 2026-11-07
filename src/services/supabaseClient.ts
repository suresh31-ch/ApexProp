import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite build defines or window/localStorage
let activeUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let activeAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!activeUrl && typeof window !== 'undefined') {
  activeUrl = (localStorage.getItem('apexprop_supabase_url') || '').trim();
}
if (!activeAnonKey && typeof window !== 'undefined') {
  activeAnonKey = (localStorage.getItem('apexprop_supabase_anon_key') || '').trim();
}

let clientInstance: SupabaseClient | null = null;

function createSupabaseInstance(url: string, key: string): SupabaseClient | null {
  if (!url || !key || !url.startsWith('https://')) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'apexprop_auth_token'
    }
  });
}

if (activeUrl && activeAnonKey) {
  clientInstance = createSupabaseInstance(activeUrl, activeAnonKey);
}

// Single reusable export
export let supabase: SupabaseClient | null = clientInstance;

export function isSupabaseConfigured(): boolean {
  return Boolean(clientInstance && activeUrl && activeAnonKey);
}

export const isSupabaseClientConfigured = Boolean(activeUrl && activeAnonKey);

let initPromise: Promise<SupabaseClient | null> | null = null;

export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  if (clientInstance) return clientInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseAnonKey) {
          activeUrl = data.supabaseUrl.trim();
          activeAnonKey = data.supabaseAnonKey.trim();
          clientInstance = createSupabaseInstance(activeUrl, activeAnonKey);
          supabase = clientInstance;
          return clientInstance;
        }
      }
    } catch (err) {
      console.warn('[SupabaseClient] Failed to load server auth configuration:', err);
    } finally {
      initPromise = null;
    }
    return clientInstance;
  })();

  return initPromise;
}

export function reinitializeSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  activeUrl = (url || '').trim();
  activeAnonKey = (anonKey || '').trim();
  clientInstance = createSupabaseInstance(activeUrl, activeAnonKey);
  supabase = clientInstance;
  return clientInstance;
}

export async function getAuthHeader(): Promise<string | undefined> {
  const client = clientInstance || (await ensureSupabaseClient());
  if (!client) return undefined;
  try {
    const { data } = await client.auth.getSession();
    if (data?.session?.access_token) {
      return `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    console.warn('[SupabaseClient] Error reading session token:', err);
  }
  return undefined;
}
