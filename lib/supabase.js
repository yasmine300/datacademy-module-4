import { createClient } from "@supabase/supabase-js";

// Les clés sont lues depuis .env.local (en local) ou depuis les variables d'environnement Vercel.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
