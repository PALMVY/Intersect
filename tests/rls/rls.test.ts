import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, beforeAll } from "vitest";

/**
 * Teste de integração contra o Supabase real. Só roda se as variáveis abaixo existirem:
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * RLS_USER_A_EMAIL, RLS_USER_A_PASSWORD, RLS_USER_B_EMAIL, RLS_USER_B_PASSWORD
 * (duas contas de teste criadas no painel).
 */
const env = process.env;
const configured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    env.RLS_USER_A_EMAIL &&
    env.RLS_USER_A_PASSWORD &&
    env.RLS_USER_B_EMAIL &&
    env.RLS_USER_B_PASSWORD,
);

const signIn = async (email: string, password: string) => {
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`login de teste falhou: ${error?.message}`);
  return { client, userId: data.user.id };
};

const tables = [
  { name: "user_profile", row: (userId: string) => ({ user_id: userId }) },
  {
    name: "user_progress",
    row: (userId: string) => ({ user_id: userId, house_id: 1, state: "in_progress" }),
  },
  {
    name: "user_thinker_signal",
    row: (userId: string) => ({ user_id: userId, thinker_id: "tales-de-mileto", read: true }),
  },
];

describe.skipIf(!configured)("RLS: cada pessoa só enxerga o próprio progresso", () => {
  let a: { client: SupabaseClient; userId: string };
  let b: { client: SupabaseClient; userId: string };

  beforeAll(async () => {
    a = await signIn(env.RLS_USER_A_EMAIL!, env.RLS_USER_A_PASSWORD!);
    b = await signIn(env.RLS_USER_B_EMAIL!, env.RLS_USER_B_PASSWORD!);
  });

  it.each(tables)("$name: A grava e lê; B não lê nem grava como A", async ({ name, row }) => {
    const write = await a.client.from(name).upsert(row(a.userId));
    expect(write.error).toBeNull();

    const own = await a.client.from(name).select("*").eq("user_id", a.userId);
    expect(own.data?.length).toBeGreaterThanOrEqual(1);

    const others = await b.client.from(name).select("*").eq("user_id", a.userId);
    expect(others.data ?? []).toHaveLength(0);

    const forged = await b.client.from(name).upsert(row(a.userId));
    expect(forged.error).not.toBeNull();
  });
});
