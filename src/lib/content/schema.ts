import { z } from "zod";

export const MODULE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ModuleLevel = (typeof MODULE_LEVELS)[number];

const connectionSchema = z.object({
  target_slug: z.string().min(1),
  relation_type: z.string().min(1),
  base_weight: z.number().int().min(1).max(10),
});

const philosopherSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  era: z.string().min(1),
  core_concept: z.string().min(1),
  summary: z.string().min(1),
  connections: z.array(connectionSchema),
});

const moduleSchema = z.object({
  level: z.enum(MODULE_LEVELS),
  order_index: z.number().int().min(1),
  title: z.string().min(1),
  source_reference: z.string().min(1),
  estimated_minutes: z.number().int().min(1),
  content_markdown: z.string().min(1),
});

const quizQuestionSchema = z.object({
  order_index: z.number().int().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_option_index: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const MIN_QUIZ_QUESTIONS = 3;

const houseSchema = z
  .object({
    order_index: z.number().int().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    notebook_phase: z.number().int().min(1),
    philosophers: z.array(philosopherSchema).min(1),
    modules: z.array(moduleSchema).min(1),
    quiz: z.array(quizQuestionSchema).min(MIN_QUIZ_QUESTIONS),
  })
  .superRefine((house, ctx) => {
    const addDuplicateIssue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: "custom", message, path });

    const slugs = new Set<string>();
    house.philosophers.forEach((philosopher, index) => {
      if (slugs.has(philosopher.slug)) {
        addDuplicateIssue(`slug de filósofo repetido: ${philosopher.slug}`, ["philosophers", index]);
      }
      slugs.add(philosopher.slug);
    });

    const moduleIds = new Set<string>();
    house.modules.forEach((module, index) => {
      const id = moduleId(module);
      if (moduleIds.has(id)) addDuplicateIssue(`módulo repetido: ${id}`, ["modules", index]);
      moduleIds.add(id);
    });

    const questionIds = new Set<string>();
    house.quiz.forEach((question, index) => {
      const id = questionId(question);
      if (questionIds.has(id)) addDuplicateIssue(`questão repetida: ${id}`, ["quiz", index]);
      questionIds.add(id);
    });
  });

export type Philosopher = z.infer<typeof philosopherSchema>;
export type HouseModule = z.infer<typeof moduleSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type House = z.infer<typeof houseSchema>;

export const moduleId = (module: Pick<HouseModule, "level" | "order_index">): string =>
  `${module.level}-${module.order_index}`;

export const questionId = (question: Pick<QuizQuestion, "order_index">): string =>
  `q${question.order_index}`;

export const parseHouse = (raw: unknown): House => houseSchema.parse(raw);
