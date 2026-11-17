import { describe, expect, it } from "vitest";
import { parseHouse, type House } from "@/lib/content/schema";
import {
  completeIfEligible,
  initialProgress,
  recordQuizScore,
  setChecklistItem,
  type ProgressRow,
} from "@/lib/progress/state";

const makeHouse = (orderIndex: number): House =>
  parseHouse({
    order_index: orderIndex,
    slug: `casa-${orderIndex}`,
    title: `Casa ${orderIndex}`,
    subtitle: "sub",
    notebook_phase: 1,
    philosophers: [
      { slug: `p${orderIndex}`, name: "P", era: "e", core_concept: "c", summary: "s", connections: [] },
    ],
    modules: [
      { level: "beginner", order_index: 1, title: "m1", source_reference: "r", estimated_minutes: 10, content_markdown: "x" },
      { level: "advanced", order_index: 1, title: "m2", source_reference: "r", estimated_minutes: 10, content_markdown: "x" },
    ],
    quiz: [1, 2, 3].map((n) => ({
      order_index: n,
      question: "?",
      options: ["a", "b", "c", "d"],
      correct_option_index: 0,
      explanation: "e",
    })),
  });

const houses = [makeHouse(1), makeHouse(2), makeHouse(3)];
const ALL_MODULES = ["beginner-1", "advanced-1"];

const stateOf = (rows: ProgressRow[], houseId: number) =>
  rows.find((row) => row.houseId === houseId)?.state;

describe("initialProgress", () => {
  it("deixa a primeira Casa em andamento e as outras bloqueadas", () => {
    const rows = initialProgress([1, 2, 3]);
    expect(rows.map((row) => row.state)).toEqual(["in_progress", "locked", "locked"]);
    expect(rows.every((row) => row.checklistDone.length === 0 && row.bestQuizScore === 0)).toBe(true);
  });
});

describe("completeIfEligible", () => {
  const withProgress = (checklist: string[], score: number) => {
    let rows = initialProgress([1, 2, 3]);
    checklist.forEach((id) => (rows = setChecklistItem(rows, 1, id, true)));
    rows = recordQuizScore(rows, 1, score);
    return completeIfEligible(rows, houses);
  };

  it("não conclui com checklist completo e nota abaixo de 70", () => {
    expect(stateOf(withProgress(ALL_MODULES, 60), 1)).toBe("in_progress");
  });

  it("não conclui com nota 100 e checklist incompleto", () => {
    expect(stateOf(withProgress(["beginner-1"], 100), 1)).toBe("in_progress");
  });

  it("conclui a Casa 1 e libera a 2 com checklist completo e nota 70", () => {
    const rows = withProgress(ALL_MODULES, 70);
    expect(stateOf(rows, 1)).toBe("completed");
    expect(stateOf(rows, 2)).toBe("in_progress");
    expect(stateOf(rows, 3)).toBe("locked");
  });

  it("conclui também quando a prova vem antes do checklist", () => {
    let rows = recordQuizScore(initialProgress([1, 2, 3]), 1, 100);
    rows = completeIfEligible(rows, houses);
    expect(stateOf(rows, 1)).toBe("in_progress");
    ALL_MODULES.forEach((id) => (rows = setChecklistItem(rows, 1, id, true)));
    expect(stateOf(completeIfEligible(rows, houses), 1)).toBe("completed");
  });

  it("concluir a última Casa não cria linha nova", () => {
    const rows: ProgressRow[] = [
      { houseId: 1, state: "completed", checklistDone: ALL_MODULES, bestQuizScore: 100 },
      { houseId: 2, state: "completed", checklistDone: ALL_MODULES, bestQuizScore: 100 },
      { houseId: 3, state: "in_progress", checklistDone: ALL_MODULES, bestQuizScore: 100 },
    ];
    const result = completeIfEligible(rows, houses);
    expect(result).toHaveLength(3);
    expect(stateOf(result, 3)).toBe("completed");
  });

  it("libera uma Casa adicionada depois, quando a anterior já estava concluída", () => {
    const rows: ProgressRow[] = [
      { houseId: 1, state: "completed", checklistDone: ALL_MODULES, bestQuizScore: 100 },
      { houseId: 2, state: "locked", checklistDone: [], bestQuizScore: 0 },
    ];
    expect(stateOf(completeIfEligible(rows, houses), 2)).toBe("in_progress");
  });
});

describe("recordQuizScore", () => {
  it("guarda só a maior nota", () => {
    let rows = recordQuizScore(initialProgress([1, 2]), 1, 80);
    rows = recordQuizScore(rows, 1, 40);
    expect(rows[0].bestQuizScore).toBe(80);
  });

  it("refazer com nota menor depois de concluída mantém a Casa concluída", () => {
    let rows = initialProgress([1, 2, 3]);
    ALL_MODULES.forEach((id) => (rows = setChecklistItem(rows, 1, id, true)));
    rows = completeIfEligible(recordQuizScore(rows, 1, 100), houses);
    rows = completeIfEligible(recordQuizScore(rows, 1, 40), houses);
    expect(stateOf(rows, 1)).toBe("completed");
    expect(rows[0].bestQuizScore).toBe(100);
  });

  it("ignora Casa bloqueada", () => {
    const rows = recordQuizScore(initialProgress([1, 2]), 2, 100);
    expect(rows[1].bestQuizScore).toBe(0);
  });
});

describe("setChecklistItem", () => {
  it("marca e desmarca sem repetir itens", () => {
    let rows = setChecklistItem(initialProgress([1]), 1, "beginner-1", true);
    rows = setChecklistItem(rows, 1, "beginner-1", true);
    expect(rows[0].checklistDone).toEqual(["beginner-1"]);
    rows = setChecklistItem(rows, 1, "beginner-1", false);
    expect(rows[0].checklistDone).toEqual([]);
  });

  it("ignora Casa bloqueada", () => {
    const rows = setChecklistItem(initialProgress([1, 2]), 2, "beginner-1", true);
    expect(rows[1].checklistDone).toEqual([]);
  });

  it("não modifica o array recebido", () => {
    const original = initialProgress([1, 2]);
    const snapshot = JSON.parse(JSON.stringify(original));
    setChecklistItem(original, 1, "beginner-1", true);
    recordQuizScore(original, 1, 90);
    completeIfEligible(original, houses);
    expect(original).toEqual(snapshot);
  });
});
