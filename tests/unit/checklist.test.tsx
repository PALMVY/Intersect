import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checklist } from "@/components/Checklist";

const items = [
  { id: "beginner-1", text: "Módulo A", detail: "Iniciante · 25 min" },
  { id: "advanced-1", text: "Módulo B", detail: "Avançado · 60 min" },
];

describe("Checklist", () => {
  it("cada item é uma caixa de seleção com rótulo acessível", () => {
    render(<Checklist items={items} done={["beginner-1"]} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox", { name: /Módulo A/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Módulo B/ })).not.toBeChecked();
  });

  it("chama onToggle com o id e o novo valor, inclusive pelo teclado", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Checklist items={items} done={[]} onToggle={onToggle} />);

    await user.tab();
    await user.keyboard(" ");
    expect(onToggle).toHaveBeenCalledWith("beginner-1", true);
  });

  it("desabilita os itens enquanto salva", () => {
    render(<Checklist items={items} done={[]} onToggle={() => {}} disabled />);
    expect(screen.getByRole("checkbox", { name: /Módulo A/ })).toBeDisabled();
  });
});
