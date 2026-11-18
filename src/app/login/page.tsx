"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await createBrowserClient().auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError("E-mail ou senha inválidos.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Verifique sua conexão e tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={signIn} className="login glass-elevated" aria-labelledby="login-title">
      <p className="brand">ARCHÉ</p>
      <h1 id="login-title">Entrar</h1>
      <label>
        E-mail
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="state state-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
