import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AsyncState } from "@/components/AsyncState";
import { HouseView } from "@/components/HouseView";
import { loadHouses } from "@/lib/content/loader";
import { loadReconciledProgress, loadSignals } from "@/lib/progress/repository";
import { createServerClient } from "@/lib/supabase/server";

export default function HousePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AsyncState status="loading" message="Carregando a Casa…" />}>
      <HouseContent params={params} />
    </Suspense>
  );
}

async function HouseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const houseId = Number(id);

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const houses = loadHouses();
  const house = houses.find((candidate) => candidate.order_index === houseId);
  if (!house) redirect("/");

  let progress;
  let signals;
  try {
    progress = await loadReconciledProgress(supabase, user.id, houses);
    signals = await loadSignals(supabase, user.id);
  } catch {
    return <AsyncState status="error" message="Não foi possível carregar esta Casa." />;
  }

  // Casa bloqueada não abre pela URL: volta para a trilha.
  const row = progress.find((candidate) => candidate.houseId === houseId);
  if (!row || row.state === "locked") redirect("/");

  return (
    <HouseView
      house={house}
      allHouses={houses}
      initialRows={progress}
      initialSignals={signals}
      userId={user.id}
    />
  );
}
