import { parseHouse, type House } from "@/lib/content/schema";

export const makeHouse = (orderIndex: number, title = `Casa ${orderIndex}`): House =>
  parseHouse({
    order_index: orderIndex,
    slug: `casa-${orderIndex}`,
    title,
    subtitle: "Subtítulo",
    notebook_phase: 1,
    philosophers: [
      { slug: `p${orderIndex}`, name: "Pensador", era: "séc. V a.C.", core_concept: "Conceito", summary: "Resumo", connections: [] },
    ],
    modules: [
      { level: "beginner", order_index: 1, title: "Módulo A", source_reference: "ref", estimated_minutes: 25, content_markdown: "Texto A" },
      { level: "advanced", order_index: 1, title: "Módulo B", source_reference: "ref", estimated_minutes: 60, content_markdown: "Texto B" },
    ],
    quiz: [1, 2, 3].map((n) => ({
      order_index: n,
      question: `Pergunta ${n}?`,
      options: ["Opção A", "Opção B", "Opção C", "Opção D"],
      correct_option_index: 1,
      explanation: `Explicação ${n}`,
    })),
  });
