import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Trail } from "@/components/Trail";
import type { ProgressRow } from "@/lib/progress/state";
import { makeHouse } from "./fixtures";

const row = (houseId: number, state: ProgressRow["state"]): ProgressRow => ({
  houseId,
  state,
  checklistDone: [],
  bestQuizScore: 0,
});

const NOTICE = /as próximas chegam em breve/i;

describe("Trail", () => {
  it("mostra os 12 nós com só a Casa 1 em andamento", () => {
    render(<Trail houses={[makeHouse(1, "Casa I")]} progress={[row(1, "in_progress")]} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
  });

  it("só a Casa liberada é link", () => {
    render(<Trail houses={[makeHouse(1, "Casa I")]} progress={[row(1, "in_progress")]} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/casa/1");
  });

  it("nós Em breve ficam aria-disabled e sem nada focável", () => {
    const { container } = render(<Trail houses={[makeHouse(1)]} progress={[row(1, "in_progress")]} />);
    const disabled = container.querySelectorAll('[aria-disabled="true"]');
    expect(disabled).toHaveLength(11);
    disabled.forEach((node) => {
      expect(node.matches("a, button, [tabindex]")).toBe(false);
      expect(node.querySelector("a, button, [tabindex]")).toBeNull();
    });
  });

  it("mostra o estado em texto", () => {
    render(
      <Trail
        houses={[makeHouse(1), makeHouse(2), makeHouse(3)]}
        progress={[row(1, "bypassed"), row(2, "in_progress"), row(3, "locked")]}
      />,
    );
    expect(screen.getByText("Validada")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Bloqueada")).toBeInTheDocument();
    expect(screen.getAllByText("Em breve")).toHaveLength(9);
  });

  it("mostra os 4 títulos de fase", () => {
    render(<Trail houses={[]} progress={[]} />);
    expect(screen.getByRole("heading", { name: "Fase 1 · O Despertar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fase 4 · O Tabuleiro de Xadrez" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
  });

  it("a fase 2 começa a numeração em 4", () => {
    render(<Trail houses={[]} progress={[]} />);
    const section = screen.getByRole("region", { name: "Fase 2 · A Engrenagem e o Cosmos" });
    expect(within(section).getByRole("list")).toHaveAttribute("start", "4");
  });

  it("avisa quando todas as Casas com conteúdo estão concluídas", () => {
    render(<Trail houses={[makeHouse(1)]} progress={[row(1, "completed")]} />);
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
  });

  it("não avisa sem Casas com conteúdo", () => {
    render(<Trail houses={[]} progress={[]} />);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("não avisa enquanto houver Casa por concluir", () => {
    render(<Trail houses={[makeHouse(1), makeHouse(2)]} progress={[row(1, "completed"), row(2, "in_progress")]} />);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("fase com mais de 3 Casas fica em coluna única e sem linha de zigue-zague", () => {
    render(<Trail houses={[makeHouse(1), makeHouse(13, "Casa extra")]} progress={[]} />);
    const section = screen.getByRole("region", { name: "Fase 1 · O Despertar" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(4);
    expect(within(section).getByRole("list")).toHaveClass("trail-phase--column");
    expect(section.querySelector("svg")).toBeNull();
  });
});
