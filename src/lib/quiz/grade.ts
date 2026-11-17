import { questionId, type QuizQuestion } from "@/lib/content/schema";

export const PASS_THRESHOLD = 70;

export type QuizResult = { score: number; passed: boolean };

/** `answers` é indexado pelo id da questão (`q1`, `q2`, ...) e guarda o índice da opção escolhida. */
export const gradeQuiz = (quiz: QuizQuestion[], answers: Record<string, number>): QuizResult => {
  const correct = quiz.filter(
    (question) => answers[questionId(question)] === question.correct_option_index,
  ).length;
  const score = Math.round((correct / quiz.length) * 100);
  return { score, passed: score >= PASS_THRESHOLD };
};
