import Link from "next/link";
import type { House } from "@/lib/content/schema";
import type { HouseState, ProgressRow } from "@/lib/progress/state";
import { AsyncState } from "./AsyncState";

const STATE_LABEL: Record<HouseState, string> = {
  locked: "Bloqueada",
  bypassed: "Validada",
  in_progress: "Em andamento",
  completed: "Concluída",
};

type Props = { houses: House[]; progress: ProgressRow[] };

const groupByPhase = (houses: House[]): [number, House[]][] => {
  const phases = new Map<number, House[]>();
  houses.forEach((house) => {
    phases.set(house.notebook_phase, [...(phases.get(house.notebook_phase) ?? []), house]);
  });
  return [...phases.entries()].sort(([a], [b]) => a - b);
};

export function HouseList({ houses, progress }: Props) {
  if (houses.length === 0) {
    return <AsyncState status="empty" message="Nenhuma Casa disponível ainda." />;
  }

  const stateOf = (house: House): HouseState =>
    progress.find((row) => row.houseId === house.order_index)?.state ?? "locked";
  const allCompleted = houses.every((house) => stateOf(house) === "completed");

  return (
    <div>
      {groupByPhase(houses).map(([phase, phaseHouses]) => (
        <section key={phase} aria-labelledby={`fase-${phase}`}>
          <h2 id={`fase-${phase}`}>Fase {phase}</h2>
          <ul className="house-list">
            {phaseHouses.map((house) => {
              const state = stateOf(house);
              const content = (
                <>
                  <span className="house-title">{house.title}</span>
                  <span className="house-subtitle">{house.subtitle}</span>
                  <span className={`badge badge-${state}`}>{STATE_LABEL[state]}</span>
                </>
              );
              return (
                <li key={house.order_index} className="house-card">
                  {state === "locked" ? (
                    <div aria-disabled="true" className="house-disabled">
                      {content}
                    </div>
                  ) : (
                    <Link href={`/casa/${house.order_index}`}>{content}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {allCompleted && (
        <p role="status" className="notice">
          Você concluiu todas as Casas disponíveis — as próximas chegam em breve.
        </p>
      )}
    </div>
  );
}
