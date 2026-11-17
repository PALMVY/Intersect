"use client";

import { useState } from "react";
import { questionId, type QuizQuestion } from "@/lib/content/schema";
import { gradeQuiz, type QuizResult } from "@/lib/quiz/grade";

type Props = { quiz: QuizQuestion[]; onFinish: (result: QuizResult) => void };

export function QuizRunner({ quiz, onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const question = quiz[current];
  const isLast = current === quiz.length - 1;
  const id = questionId(question);

  const submitAnswer = () => {
    if (selected === null) return;
    setAnswers((previous) => ({ ...previous, [id]: selected }));
    setRevealed(true);
  };

  const goNext = () => {
    if (isLast) {
      onFinish(gradeQuiz(quiz, answers));
      return;
    }
    setCurrent(current + 1);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <form
      className="quiz"
      onSubmit={(event) => {
        event.preventDefault();
        if (revealed) goNext();
        else submitAnswer();
      }}
    >
      <p className="quiz-progress">
        Questão {current + 1} de {quiz.length}
      </p>
      <fieldset disabled={revealed}>
        <legend>{question.question}</legend>
        {question.options.map((option, index) => (
          <label key={option} className="quiz-option">
            <input
              type="radio"
              name={id}
              checked={selected === index}
              onChange={() => setSelected(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      {revealed && (
        <div role="status" className="quiz-feedback">
          <p>
            {selected === question.correct_option_index ? "Certo!" : "Não foi dessa vez."} Resposta
            certa: {question.options[question.correct_option_index]}
          </p>
          <p>{question.explanation}</p>
        </div>
      )}

      {revealed ? (
        <button type="submit">{isLast ? "Ver resultado" : "Próxima"}</button>
      ) : (
        <button type="submit" disabled={selected === null}>
          Responder
        </button>
      )}
    </form>
  );
}
