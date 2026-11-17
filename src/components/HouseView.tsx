"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { moduleId, type House } from "@/lib/content/schema";
import {
  saveProgress,
  saveThinkerSignal,
  type ThinkerSignal,
} from "@/lib/progress/repository";
import {
  completeIfEligible,
  recordQuizScore,
  setChecklistItem,
  type ProgressRow,
} from "@/lib/progress/state";
import type { QuizResult } from "@/lib/quiz/grade";
import { createBrowserClient } from "@/lib/supabase/client";
import { Checklist, type ChecklistItem } from "./Checklist";
import { QuizRunner } from "./QuizRunner";
import { ThinkerList } from "./ThinkerList";

const LEVEL_LABEL = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };
const withDefaults = (signal?: ThinkerSignal): ThinkerSignal => ({
  read: false,
  favorite: false,
  quizPassed: false,
  ...signal,
});
const SAVE_ERROR = "Não foi possível salvar. Verifique sua conexão e tente de novo.";

type Props = {
  house: House;
  allHouses: House[];
  initialRows: ProgressRow[];
  initialSignals: Record<string, ThinkerSignal>;
  userId: string;
};

export function HouseView({ house, allHouses, initialRows, initialSignals, userId }: Props) {
  const db = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState(initialRows);
  const [signals, setSignals] = useState(initialSignals);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizAttempt, setQuizAttempt] = useState(0);

  const row = rows.find((candidate) => candidate.houseId === house.order_index)!;
  const nextHouse = allHouses.find((candidate) => candidate.order_index > house.order_index);
  const nextRow = nextHouse && rows.find((candidate) => candidate.houseId === nextHouse.order_index);

  const items: ChecklistItem[] = house.modules.map((module) => ({
    id: moduleId(module),
    text: module.title,
    detail: `${LEVEL_LABEL[module.level]} · ${module.estimated_minutes} min · ${module.source_reference}`,
    description: module.content_markdown,
  }));

  // Salva primeiro; só atualiza a tela se o banco confirmou, para nunca mostrar progresso que não existe.
  const persist = async (next: ProgressRow[]): Promise<boolean> => {
    const changed = next.filter(
      (candidate) =>
        JSON.stringify(candidate) !== JSON.stringify(rows.find((old) => old.houseId === candidate.houseId)),
    );
    setSaving(true);
    setError(null);
    try {
      for (const changedRow of changed) await saveProgress(db, userId, changedRow);
      setRows(next);
      return true;
    } catch {
      setError(SAVE_ERROR);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (itemId: string, done: boolean) =>
    persist(completeIfEligible(setChecklistItem(rows, house.order_index, itemId, done), allHouses));

  const finishQuiz = async (quizResult: QuizResult) => {
    setResult(quizResult);
    const saved = await persist(
      completeIfEligible(recordQuizScore(rows, house.order_index, quizResult.score), allHouses),
    );
    if (!saved || !quizResult.passed) return;
    try {
      for (const thinker of house.philosophers) {
        await saveThinkerSignal(db, userId, { thinkerId: thinker.slug, quizPassed: true });
      }
      setSignals((previous) =>
        Object.fromEntries([
          ...Object.entries(previous),
          ...house.philosophers.map((thinker) => [
            thinker.slug,
            { ...withDefaults(previous[thinker.slug]), quizPassed: true },
          ]),
        ]),
      );
    } catch {
      setError(SAVE_ERROR);
    }
  };

  const changeSignal = async (
    thinkerId: string,
    patch: Partial<Pick<ThinkerSignal, "read" | "favorite">>,
  ) => {
    setSaving(true);
    setError(null);
    try {
      await saveThinkerSignal(db, userId, { thinkerId, ...patch });
      setSignals((previous) => ({
        ...previous,
        [thinkerId]: { ...withDefaults(previous[thinkerId]), ...patch },
      }));
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article>
      <p>
        <Link href="/">← Trilha</Link>
      </p>
      <h1>{house.title}</h1>
      <p className="subtitle">{house.subtitle}</p>

      {error && (
        <p role="alert" className="state state-error">
          {error}
        </p>
      )}
      {saving && (
        <p role="status" className="notice">
          Salvando…
        </p>
      )}

      {row.state === "completed" && (
        <p role="status" className="notice notice-success">
          Casa concluída!{" "}
          {nextRow && nextRow.state !== "locked" && nextHouse ? (
            <Link href={`/casa/${nextHouse.order_index}`}>Ir para a próxima Casa</Link>
          ) : (
            "As próximas Casas chegam em breve."
          )}
        </p>
      )}

      <section aria-labelledby="pensadores">
        <h2 id="pensadores">Pensadores</h2>
        <ThinkerList thinkers={house.philosophers} signals={signals} onChange={changeSignal} disabled={saving} />
      </section>

      <section aria-labelledby="modulos">
        <h2 id="modulos">Módulos de estudo</h2>
        <Checklist items={items} done={row.checklistDone} onToggle={toggleItem} disabled={saving} />
      </section>

      <section aria-labelledby="prova">
        <h2 id="prova">Mini-prova</h2>
        <p className="subtitle">
          Melhor nota: {row.bestQuizScore}% · aprovação a partir de 70%. Pode refazer quantas vezes quiser.
        </p>
        {result ? (
          <div role="status" className="quiz-result">
            <p>
              Sua nota: <strong>{result.score}%</strong> — {result.passed ? "aprovado!" : "ainda não passou."}
            </p>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setQuizAttempt(quizAttempt + 1);
              }}
            >
              Refazer a prova
            </button>
          </div>
        ) : (
          <QuizRunner key={quizAttempt} quiz={house.quiz} onFinish={finishQuiz} />
        )}
      </section>
    </article>
  );
}
