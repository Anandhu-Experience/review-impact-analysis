/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Absent in the offline demo, which falls back to the seed. */
  readonly VITE_SUPABASE_URL?: string;
  /** Current key format (sb_publishable_…). Public by design; RLS protects the data. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy JWT anon key, for projects created before the publishable/secret split. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
