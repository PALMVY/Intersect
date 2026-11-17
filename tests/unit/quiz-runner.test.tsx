import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuizRunner } from "@/components/QuizRunner";
import { makeHouse } from "./fixtures";

const { quiz } = makeHouse(1);

const answer = async (user: ReturnType<typeof userEvent.setup>, option: string) => {
  await user.click(screen.getByRole("radio", { name: option }));
  await user.click(screen.getByRole("button", { name: "Responder" }));
};

describe("QuizRunner", () => {
  it("mostra uma questão por vez e exige uma resposta antes de responder", () => {
    render(<QuizRunner quiz={quiz} onFinish={() => {}} />);
    expect(screen.getByText("Pergunta 1?")).toBeInTheDocument();
    expect(screen.queryByText("Pergunta 2?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Responder" })).toBeDisabled();
  });

  it("mostra a explicação depois de responder", async () => {
    const user = userEvent.setup();
    render(<QuizRunner quiz={quiz} onFinish={() => {}} />);
    await answer(user, "Opção A");
    expect(screen.getByText("Explicação 1")).toBeInTheDocument();
    expect(screen.getByText(/resposta certa: opção b/i)).toBeInTheDocument();
  });

  it("chama onFinish com a nota ao terminar", async () => {
    const onFinish = vi.fn();
    const user = userEvent.setup();
    render(<QuizRunner quiz={quiz} onFinish={onFinish} />);

    await answer(user, "Opção B");
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await answer(user, "Opção B");
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    await answer(user, "Opção A");
    await user.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(onFinish).toHaveBeenCalledWith({ score: 67, passed: false });
  });

  it("dá para responder só pelo teclado", async () => {
    const user = userEvent.setup();
    render(<QuizRunner quiz={quiz} onFinish={() => {}} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Explicação 1")).toBeInTheDocument();
  });
});
