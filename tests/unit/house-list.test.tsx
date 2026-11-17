import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HouseList } from "@/components/HouseList";
import type { ProgressRow } from "@/lib/progress/state";
import { makeHouse } from "./fixtures";

const row = (houseId: number, state: ProgressRow["state"]): ProgressRow => ({
  houseId,
  state,
  checklistDone: [],
  bestQuizScore: 0,
});

describe("HouseList", () => {
  const houses = [makeHouse(1, "Casa I"), makeHouse(2, "Casa II")];

  it("agrupa por fase e mostra o estado de cada Casa", () => {
    render(<HouseList houses={houses} progress={[row(1, "in_progress"), row(2, "locked")]} />);
    expect(screen.getByRole("heading", { name: "Fase 1" })).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Bloqueada")).toBeInTheDocument();
  });

  it("só Casas em andamento ou concluídas são links", () => {
    render(<HouseList houses={houses} progress={[row(1, "completed"), row(2, "locked")]} />);
    expect(screen.getByRole("link", { name: /Casa I/ })).toHaveAttribute("href", "/casa/1");
    expect(screen.queryByRole("link", { name: /Casa II/ })).not.toBeInTheDocument();
  });

  it("avisa que as próximas Casas chegam em breve quando todas estão concluídas", () => {
    render(<HouseList houses={houses} progress={[row(1, "completed"), row(2, "completed")]} />);
    expect(screen.getByText(/as próximas chegam em breve/i)).toBeInTheDocument();
  });

  it("não mostra o aviso enquanto houver Casa por concluir", () => {
    render(<HouseList houses={houses} progress={[row(1, "completed"), row(2, "in_progress")]} />);
    expect(screen.queryByText(/as próximas chegam em breve/i)).not.toBeInTheDocument();
  });

  it("mostra o estado vazio sem Casas", () => {
    render(<HouseList houses={[]} progress={[]} />);
    expect(screen.getByText(/nenhuma casa disponível/i)).toBeInTheDocument();
  });
});
