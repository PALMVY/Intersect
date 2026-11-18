import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AsyncState } from "@/components/AsyncState";
import { SignOutButton } from "@/components/SignOutButton";
import { Trail } from "@/components/Trail";
import { loadHouses } from "@/lib/content/loader";
import { loadReconciledProgress } from "@/lib/progress/repository";
import type { ProgressRow } from "@/lib/progress/state";
import { createServerClient } from "@/lib/supabase/server";

export default function TrailPage() {
  return (
    <>
      <header className="page-header">
        <p className="brand">ARCHÉ</p>
        <SignOutButton />
      </header>
      <h1 className="trail-heading">Trilha das 12 Casas</h1>
      <Suspense fallback={<AsyncState status="loading" message="Carregando sua trilha…" />}>
        <TrailContent />
      </Suspense>
    </>
  );
}

async function TrailContent() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const houses = loadHouses();
  let progress: ProgressRow[] | null = null;
  try {
    progress = await loadReconciledProgress(supabase, user.id, houses);
  } catch {
    progress = null;
  }

  return progress ? (
    <Trail houses={houses} progress={progress} />
  ) : (
    <AsyncState status="error" message="Não foi possível carregar seu progresso." />
  );
}
