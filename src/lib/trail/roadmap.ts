import type { House } from "@/lib/content/schema";
import type { HouseState, ProgressRow } from "@/lib/progress/state";

export type Phase = 1 | 2 | 3 | 4;

export type RoadmapEntry = { orderIndex: number; title: string; phase: Phase };

export const PHASE_NAMES: Record<Phase, string> = {
  1: "O Despertar",
  2: "A Engrenagem e o Cosmos",
  3: "Os Porões da Mente",
  4: "O Tabuleiro de Xadrez",
};

/** As 12 Casas do design original. Só para exibição: o conteúdo real vem de content/houses. */
export const ROADMAP: RoadmapEntry[] = [
  { orderIndex: 1, title: "Mitologia Grega e Pré-Socráticos", phase: 1 },
  { orderIndex: 2, title: "Sócrates, Platão e Aristóteles", phase: 1 },
  { orderIndex: 3, title: "Santo Agostinho e Tomás de Aquino", phase: 1 },
  { orderIndex: 4, title: "Carl Sagan e Descartes", phase: 2 },
  { orderIndex: 5, title: "Spinoza, Locke, Hume e Kant", phase: 2 },
  { orderIndex: 6, title: "Neurociência Básica e Neuroplasticidade", phase: 2 },
  { orderIndex: 7, title: "Nietzsche, Marx e Foucault", phase: 3 },
  { orderIndex: 8, title: "Sigmund Freud", phase: 3 },
  { orderIndex: 9, title: "Heidegger, Dostoiévski e Kafka", phase: 3 },
  { orderIndex: 10, title: "Robert Cialdini", phase: 4 },
  { orderIndex: 11, title: "Maquiavel e Sun Tzu", phase: 4 },
  { orderIndex: 12, title: "Robert Greene e George Orwell", phase: 4 },
];

export type TrailStatus = HouseState | "coming_soon";

export type TrailNode = {
  orderIndex: number;
  title: string;
  subtitle: string | null;
  phase: number;
  status: TrailStatus;
  href: string | null;
};

const OPEN_STATES: ReadonlySet<TrailStatus> = new Set(["in_progress", "completed", "bypassed"]);

const hasContent = (node: TrailNode): boolean => node.status !== "coming_soon";

const nodeFromHouse = (house: House, progress: ProgressRow[]): TrailNode => {
  const status = progress.find((row) => row.houseId === house.order_index)?.state ?? "locked";
  const entry = ROADMAP.find((candidate) => candidate.orderIndex === house.order_index);
  return {
    orderIndex: house.order_index,
    title: house.title,
    subtitle: house.subtitle,
    phase: entry?.phase ?? house.notebook_phase,
    status,
    href: OPEN_STATES.has(status) ? `/casa/${house.order_index}` : null,
  };
};

const nodeFromRoadmap = (entry: RoadmapEntry): TrailNode => ({
  orderIndex: entry.orderIndex,
  title: entry.title,
  subtitle: null,
  phase: entry.phase,
  status: "coming_soon",
  href: null,
});

/** Junta o ROADMAP fixo com as Casas que têm conteúdo; o JSON prevalece. */
export const buildTrail = (houses: House[], progress: ProgressRow[]): TrailNode[] => {
  const fromHouses = houses.map((house) => nodeFromHouse(house, progress));
  const withContent = new Set(fromHouses.map((node) => node.orderIndex));
  const fromRoadmap = ROADMAP.filter((entry) => !withContent.has(entry.orderIndex)).map(nodeFromRoadmap);
  return [...fromHouses, ...fromRoadmap].sort((a, b) => a.orderIndex - b.orderIndex);
};

/** Verdadeiro só se existe Casa com conteúdo e todas estão concluídas. */
export const allAvailableCompleted = (nodes: TrailNode[]): boolean => {
  const available = nodes.filter(hasContent);
  return available.length > 0 && available.every((node) => node.status === "completed");
};

export type ZigzagColumn = 1 | 2 | 3;

/** Coluna do nó no zigue-zague do desktop: fases ímpares descem para a direita, pares para a esquerda. */
export const zigzagColumn = (indexInPhase: number, phase: number): ZigzagColumn => {
  if (indexInPhase === 0) return phase % 2 === 0 ? 3 : 1;
  if (indexInPhase === 1) return 2;
  if (indexInPhase === 2) return phase % 2 === 0 ? 1 : 3;
  return 1;
};
