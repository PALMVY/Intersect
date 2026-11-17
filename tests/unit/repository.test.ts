import { describe, expect, it } from "vitest";
import { makeHouse } from "./fixtures";
import {
  loadProgress,
  loadReconciledProgress,
  loadSignals,
  saveProgress,
  saveThinkerSignal,
  type Db,
} from "@/lib/progress/repository";

type Call = { table: string; kind: "select" | "upsert"; payload?: unknown; options?: unknown };

const makeDb = (config: {
  progressRows?: unknown[];
  signalRows?: unknown[];
  error?: { message: string };
}) => {
  const calls: Call[] = [];
  const db = {
    from: (table: string) => ({
      select: () => ({
        eq: async () => {
          calls.push({ table, kind: "select" });
          if (config.error) return { data: null, error: config.error };
          const data = table === "user_progress" ? config.progressRows : config.signalRows;
          return { data: data ?? [], error: null };
        },
      }),
      upsert: async (payload: unknown, options?: unknown) => {
        calls.push({ table, kind: "upsert", payload, options });
        return { error: config.error ?? null };
      },
    }),
  } as unknown as Db;
  return { db, calls };
};

describe("loadProgress", () => {
  it("no primeiro acesso cria o perfil e as linhas iniciais", async () => {
    const { db, calls } = makeDb({ progressRows: [] });
    const rows = await loadProgress(db, "user-1", [1, 2, 3]);

    expect(rows.map((row) => row.state)).toEqual(["in_progress", "locked", "locked"]);
    const profileCall = calls.find((call) => call.table === "user_profile");
    expect(profileCall?.payload).toEqual({ user_id: "user-1" });
    const progressUpsert = calls.find((call) => call.table === "user_progress" && call.kind === "upsert");
    expect(progressUpsert?.payload).toHaveLength(3);
  });

  it("no segundo acesso só lê e converte as colunas", async () => {
    const { db, calls } = makeDb({
      progressRows: [
        { house_id: 1, state: "completed", checklist_done: ["beginner-1"], best_quiz_score: 100 },
        { house_id: 2, state: "in_progress", checklist_done: [], best_quiz_score: 0 },
      ],
    });
    const rows = await loadProgress(db, "user-1", [1, 2]);

    expect(rows[0]).toEqual({
      houseId: 1,
      state: "completed",
      checklistDone: ["beginner-1"],
      bestQuizScore: 100,
    });
    expect(calls.some((call) => call.kind === "upsert")).toBe(false);
  });

  it("cria como bloqueada uma Casa nova que ainda não tem linha", async () => {
    const { db, calls } = makeDb({
      progressRows: [{ house_id: 1, state: "completed", checklist_done: [], best_quiz_score: 100 }],
    });
    const rows = await loadProgress(db, "user-1", [1, 2]);

    expect(rows.find((row) => row.houseId === 2)?.state).toBe("locked");
    const upsert = calls.find((call) => call.table === "user_progress" && call.kind === "upsert");
    expect(upsert?.payload).toHaveLength(1);
  });

  it("lança quando a leitura falha", async () => {
    const { db } = makeDb({ error: { message: "rede caiu" } });
    await expect(loadProgress(db, "user-1", [1])).rejects.toThrow("rede caiu");
  });
});

describe("loadReconciledProgress", () => {
  it("libera e grava a Casa nova cuja anterior já estava concluída", async () => {
    const houses = [makeHouse(1), makeHouse(2)];
    const { db, calls } = makeDb({
      progressRows: [
        { house_id: 1, state: "completed", checklist_done: ["beginner-1", "advanced-1"], best_quiz_score: 100 },
      ],
    });
    const rows = await loadReconciledProgress(db, "user-1", houses);

    expect(rows.map((row) => row.state)).toEqual(["completed", "in_progress"]);
    const upserts = calls.filter((call) => call.table === "user_progress" && call.kind === "upsert");
    expect(upserts.at(-1)?.payload).toEqual([
      expect.objectContaining({ house_id: 2, state: "in_progress" }),
    ]);
  });
});

describe("saveProgress", () => {
  it("faz upsert pela chave primária", async () => {
    const { db, calls } = makeDb({});
    await saveProgress(db, "user-1", {
      houseId: 1,
      state: "in_progress",
      checklistDone: ["beginner-1"],
      bestQuizScore: 67,
    });
    expect(calls[0].payload).toEqual({
      user_id: "user-1",
      house_id: 1,
      state: "in_progress",
      checklist_done: ["beginner-1"],
      best_quiz_score: 67,
    });
    expect(calls[0].options).toEqual({ onConflict: "user_id,house_id" });
  });

  it("lança quando o banco devolve erro", async () => {
    const { db } = makeDb({ error: { message: "sem conexão" } });
    await expect(
      saveProgress(db, "user-1", { houseId: 1, state: "in_progress", checklistDone: [], bestQuizScore: 0 }),
    ).rejects.toThrow("sem conexão");
  });
});

describe("sinais de pensadores", () => {
  it("envia só os campos informados", async () => {
    const { db, calls } = makeDb({});
    await saveThinkerSignal(db, "user-1", { thinkerId: "heraclito", favorite: true });
    expect(calls[0].payload).toEqual({ user_id: "user-1", thinker_id: "heraclito", favorite: true });
    expect(calls[0].options).toEqual({ onConflict: "user_id,thinker_id" });
  });

  it("lê os sinais indexados por pensador", async () => {
    const { db } = makeDb({
      signalRows: [{ thinker_id: "heraclito", read: true, favorite: false, quiz_passed: true }],
    });
    expect(await loadSignals(db, "user-1")).toEqual({
      heraclito: { read: true, favorite: false, quizPassed: true },
    });
  });
});
