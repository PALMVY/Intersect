import { describe, expect, it } from "vitest";
import type { ProgressRow } from "@/lib/progress/state";
import { allAvailableCompleted, buildTrail, ROADMAP, zigzagColumn } from "@/lib/trail/roadmap";
import { makeHouse } from "./fixtures";

const row = (houseId: number, state: ProgressRow["state"]): ProgressRow => ({
  houseId,
  state,
  checklistDone: [],
  bestQuizScore: 0,
});

describe("ROADMAP", () => {
  it("tem as 12 Casas em 4 fases de 3", () => {
    expect(ROADMAP.map((entry) => entry.orderIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(ROADMAP.map((entry) => entry.phase)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  });
});

describe("buildTrail", () => {
  it("sem Casas no JSON mostra 12 nós Em breve e nenhum link", () => {
    const nodes = buildTrail([], []);
    expect(nodes).toHaveLength(12);
    expect(nodes.every((node) => node.status === "coming_soon" && node.href === null)).toBe(true);
    expect(allAvailableCompleted(nodes)).toBe(false);
  });

  it("usa o título do JSON na Casa com conteúdo e o do ROADMAP nas demais", () => {
    const nodes = buildTrail([makeHouse(1, "A Centelha do Logos")], [row(1, "in_progress")]);
    expect(nodes[0]).toMatchObject({ title: "A Centelha do Logos", subtitle: "Subtítulo", status: "in_progress", href: "/casa/1", phase: 1 });
    expect(nodes[1]).toMatchObject({ title: "Sócrates, Platão e Aristóteles", subtitle: null, status: "coming_soon", href: null });
  });

  it("Casa validada é link", () => {
    const [node] = buildTrail([makeHouse(1)], [row(1, "bypassed")]);
    expect(node).toMatchObject({ status: "bypassed", href: "/casa/1" });
  });

  it("Casa com conteúdo sem linha de progresso fica bloqueada", () => {
    const nodes = buildTrail([makeHouse(1), makeHouse(2)], [row(1, "in_progress")]);
    expect(nodes[1]).toMatchObject({ status: "locked", href: null });
  });

  it("Casa fora do ROADMAP vira nó extra no fim com a fase do JSON", () => {
    const nodes = buildTrail([makeHouse(13, "Casa extra")], [row(13, "in_progress")]);
    expect(nodes).toHaveLength(13);
    expect(nodes[12]).toMatchObject({ orderIndex: 13, title: "Casa extra", phase: 1 });
  });
});

describe("allAvailableCompleted", () => {
  const houses = [makeHouse(1), makeHouse(2)];

  it("é verdadeiro quando todas as Casas com conteúdo estão concluídas", () => {
    expect(allAvailableCompleted(buildTrail(houses, [row(1, "completed"), row(2, "completed")]))).toBe(true);
  });

  it("é falso enquanto houver Casa com conteúdo por concluir", () => {
    expect(allAvailableCompleted(buildTrail(houses, [row(1, "completed"), row(2, "in_progress")]))).toBe(false);
  });
});

describe("zigzagColumn", () => {
  it("fases ímpares vão da esquerda para a direita", () => {
    expect(zigzagColumn(0, 1)).toBe(1);
    expect(zigzagColumn(1, 1)).toBe(2);
    expect(zigzagColumn(2, 1)).toBe(3);
  });

  it("fases pares vão da direita para a esquerda", () => {
    expect(zigzagColumn(0, 2)).toBe(3);
    expect(zigzagColumn(2, 2)).toBe(1);
  });

  it("índice fora de 0 a 2 cai na coluna 1", () => {
    expect(zigzagColumn(3, 1)).toBe(1);
    expect(zigzagColumn(-1, 2)).toBe(1);
  });
});
