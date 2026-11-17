import { describe, expect, it } from "vitest";
import { gradeQuiz, PASS_THRESHOLD } from "@/lib/quiz/grade";
import type { QuizQuestion } from "@/lib/content/schema";

const makeQuiz = (count: number): QuizQuestion[] =>
  Array.from({ length: count }, (_, index) => ({
    order_index: index + 1,
    question: `Pergunta ${index + 1}`,
    options: ["a", "b", "c", "d"],
    correct_option_index: 1,
    explanation: "porque sim",
  }));

const answersWithCorrect = (quiz: QuizQuestion[], correct: number): Record<string, number> =>
  Object.fromEntries(
    quiz.map((question, index) => [`q${question.order_index}`, index < correct ? 1 : 0]),
  );

describe("gradeQuiz", () => {
  it("usa 70 como nota de aprovação", () => {
    expect(PASS_THRESHOLD).toBe(70);
  });

  it.each([
    [5, 5, 100, true],
    [5, 4, 80, true],
    [5, 3, 60, false],
    [3, 3, 100, true],
    [3, 2, 67, false],
  ])("prova de %i questões com %i certas dá %i (aprovado: %s)", (total, correct, score, passed) => {
    const quiz = makeQuiz(total);
    expect(gradeQuiz(quiz, answersWithCorrect(quiz, correct))).toEqual({ score, passed });
  });

  it("conta questão sem resposta como errada", () => {
    expect(gradeQuiz(makeQuiz(3), {})).toEqual({ score: 0, passed: false });
  });

  it("ignora resposta de questão que não existe", () => {
    const quiz = makeQuiz(3);
    const answers = { ...answersWithCorrect(quiz, 3), q99: 1 };
    expect(gradeQuiz(quiz, answers)).toEqual({ score: 100, passed: true });
  });
});
