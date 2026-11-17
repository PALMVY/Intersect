import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

// As variáveis NEXT_PUBLIC_* precisam ser lidas literalmente para entrarem no bundle do navegador.
export const createBrowserClient = () =>
  createSsrBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
