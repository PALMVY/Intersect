import { moduleId, type House } from "@/lib/content/schema";
import { PASS_THRESHOLD } from "@/lib/quiz/grade";

export type HouseState = "locked" | "bypassed" | "in_progress" | "completed";

export type ProgressRow = {
  houseId: number;
  state: HouseState;
  checklistDone: string[];
  bestQuizScore: number;
};

const isEditable = (row: ProgressRow) => row.state === "in_progress" || row.state === "completed";

const mapRow = (
  rows: ProgressRow[],
  houseId: number,
  update: (row: ProgressRow) => ProgressRow,
): ProgressRow[] => rows.map((row) => (row.houseId === houseId ? update(row) : row));

/** A primeira Casa começa em andamento; as demais, bloqueadas. `houseIds` em ordem crescente. */
export const initialProgress = (houseIds: number[]): ProgressRow[] =>
  houseIds.map((houseId, index) => ({
    houseId,
    state: index === 0 ? "in_progress" : "locked",
    checklistDone: [],
    bestQuizScore: 0,
  }));

export const setChecklistItem = (
  rows: ProgressRow[],
  houseId: number,
  itemId: string,
  done: boolean,
): ProgressRow[] =>
  mapRow(rows, houseId, (row) => {
    if (!isEditable(row)) return row;
    const without = row.checklistDone.filter((id) => id !== itemId);
    return { ...row, checklistDone: done ? [...without, itemId] : without };
  });

export const recordQuizScore = (rows: ProgressRow[], houseId: number, score: number): ProgressRow[] =>
  mapRow(rows, houseId, (row) =>
    isEditable(row) ? { ...row, bestQuizScore: Math.max(row.bestQuizScore, score) } : row,
  );

const hasFinishedHouse = (row: ProgressRow, house: House): boolean =>
  house.modules.every((module) => row.checklistDone.includes(moduleId(module))) &&
  row.bestQuizScore >= PASS_THRESHOLD;

/**
 * Conclui as Casas em andamento que cumpriram checklist e prova e libera a Casa seguinte.
 * `completed` é terminal. Também libera Casas adicionadas depois, cuja anterior já estava concluída.
 */
export const completeIfEligible = (rows: ProgressRow[], houses: House[]): ProgressRow[] => {
  const houseById = new Map(houses.map((house) => [house.order_index, house]));

  const completed = rows.map((row) => {
    const house = houseById.get(row.houseId);
    return row.state === "in_progress" && house && hasFinishedHouse(row, house)
      ? { ...row, state: "completed" as const }
      : row;
  });

  const sorted = [...completed].sort((a, b) => a.houseId - b.houseId);
  const unlockedIds = new Set(
    sorted
      .filter((row, index) => row.state === "locked" && sorted[index - 1]?.state === "completed")
      .map((row) => row.houseId),
  );

  return completed.map((row) =>
    unlockedIds.has(row.houseId) ? { ...row, state: "in_progress" as const } : row,
  );
};
