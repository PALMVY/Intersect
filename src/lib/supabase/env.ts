/** A chave "publishable" é pública por design: quem protege os dados é a RLS, não o segredo da chave. */
export const getSupabaseEnv = (): { url: string; publishableKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copie .env.local.example para .env.local.",
    );
  }
  return { url, publishableKey };
};
