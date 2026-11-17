import type { SupabaseClient } from "@supabase/supabase-js";
import type { House } from "@/lib/content/schema";
import { completeIfEligible, initialProgress, type HouseState, type ProgressRow } from "./state";

export type Db = Pick<SupabaseClient, "from">;

export type ThinkerSignal = { read: boolean; favorite: boolean; quizPassed: boolean };

type ProgressDbRow = {
  house_id: number;
  state: HouseState;
  checklist_done: string[];
  best_quiz_score: number;
};

const fail = (error: { message: string }): never => {
  throw new Error(error.message);
};

const fromDb = (row: ProgressDbRow): ProgressRow => ({
  houseId: row.house_id,
  state: row.state,
  checklistDone: row.checklist_done,
  bestQuizScore: row.best_quiz_score,
});

const toDb = (userId: string, row: ProgressRow) => ({
  user_id: userId,
  house_id: row.houseId,
  state: row.state,
  checklist_done: row.checklistDone,
  best_quiz_score: row.bestQuizScore,
});

const PROGRESS_KEY = { onConflict: "user_id,house_id" };

const insertRows = async (db: Db, userId: string, rows: ProgressRow[]) => {
  const { error } = await db.from("user_progress").upsert(rows.map((row) => toDb(userId, row)), PROGRESS_KEY);
  if (error) fail(error);
};

/**
 * Lê o progresso da pessoa. No primeiro acesso cria o perfil e as linhas iniciais;
 * Casas novas no conteúdo ganham uma linha `locked` (quem as libera é `completeIfEligible`).
 * `houseIds` em ordem crescente.
 */
export const loadProgress = async (
  db: Db,
  userId: string,
  houseIds: number[],
): Promise<ProgressRow[]> => {
  const { data, error } = await db.from("user_progress").select("*").eq("user_id", userId);
  if (error) fail(error);

  const existing = ((data ?? []) as ProgressDbRow[])
    .map(fromDb)
    .filter((row) => houseIds.includes(row.houseId));

  if (existing.length === 0) {
    const profile = await db
      .from("user_profile")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    if (profile.error) fail(profile.error);
    const initial = initialProgress(houseIds);
    await insertRows(db, userId, initial);
    return initial;
  }

  const known = new Set(existing.map((row) => row.houseId));
  const added: ProgressRow[] = houseIds
    .filter((houseId) => !known.has(houseId))
    .map((houseId) => ({ houseId, state: "locked", checklistDone: [], bestQuizScore: 0 }));
  if (added.length > 0) await insertRows(db, userId, added);

  return [...existing, ...added].sort((a, b) => a.houseId - b.houseId);
};

export const saveProgress = async (db: Db, userId: string, row: ProgressRow): Promise<void> => {
  const { error } = await db.from("user_progress").upsert(toDb(userId, row), PROGRESS_KEY);
  if (error) fail(error);
};

export const loadSignals = async (
  db: Db,
  userId: string,
): Promise<Record<string, ThinkerSignal>> => {
  const { data, error } = await db.from("user_thinker_signal").select("*").eq("user_id", userId);
  if (error) fail(error);

  const rows = (data ?? []) as {
    thinker_id: string;
    read: boolean;
    favorite: boolean;
    quiz_passed: boolean;
  }[];
  return Object.fromEntries(
    rows.map((row) => [
      row.thinker_id,
      { read: row.read, favorite: row.favorite, quizPassed: row.quiz_passed },
    ]),
  );
};

export type SignalUpdate = { thinkerId: string } & Partial<ThinkerSignal>;

export const saveThinkerSignal = async (
  db: Db,
  userId: string,
  { thinkerId, read, favorite, quizPassed }: SignalUpdate,
): Promise<void> => {
  const fields = {
    ...(read !== undefined && { read }),
    ...(favorite !== undefined && { favorite }),
    ...(quizPassed !== undefined && { quiz_passed: quizPassed }),
  };
  const { error } = await db
    .from("user_thinker_signal")
    .upsert({ user_id: userId, thinker_id: thinkerId, ...fields }, { onConflict: "user_id,thinker_id" });
  if (error) fail(error);
};

/** Lê o progresso, libera Casas novas quando for o caso e grava só o que mudou. */
export const loadReconciledProgress = async (
  db: Db,
  userId: string,
  houses: House[],
): Promise<ProgressRow[]> => {
  const loaded = await loadProgress(
    db,
    userId,
    houses.map((house) => house.order_index),
  );
  const reconciled = completeIfEligible(loaded, houses);
  const changed = reconciled.filter(
    (row, index) => JSON.stringify(row) !== JSON.stringify(loaded[index]),
  );
  if (changed.length > 0) await insertRows(db, userId, changed);
  return reconciled;
};
