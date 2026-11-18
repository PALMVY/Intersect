import Link from "next/link";
import type { House } from "@/lib/content/schema";
import type { ProgressRow } from "@/lib/progress/state";
import {
  allAvailableCompleted,
  buildTrail,
  PHASE_NAMES,
  type Phase,
  type TrailNode,
  type TrailStatus,
  zigzagColumn,
} from "@/lib/trail/roadmap";

const STATUS_LABEL: Record<TrailStatus, string> = {
  locked: "Bloqueada",
  bypassed: "Validada",
  in_progress: "Em andamento",
  completed: "Concluída",
  coming_soon: "Em breve",
};

/** O zigue-zague só cabe em fases de até 3 Casas; fases maiores ficam em coluna única. */
const ZIGZAG_COLUMNS = 3;

const isPhase = (phase: number): phase is Phase => phase in PHASE_NAMES;

const phaseTitle = (phase: number): string =>
  isPhase(phase) ? `Fase ${phase} · ${PHASE_NAMES[phase]}` : `Fase ${phase}`;

const groupByPhase = (nodes: TrailNode[]): [number, TrailNode[]][] => {
  const phases = new Map<number, TrailNode[]>();
  nodes.forEach((node) => phases.set(node.phase, [...(phases.get(node.phase) ?? []), node]));
  return [...phases.entries()].sort(([a], [b]) => a - b);
};

/** Linha tracejada do desktop, ligando os centros das células do zigue-zague. */
function PhasePath({ phase, count }: { phase: number; count: number }) {
  if (count < 2 || count > ZIGZAG_COLUMNS) return null;
  const points = Array.from({ length: count }, (_, index) => {
    const x = ((zigzagColumn(index, phase) - 0.5) / 3) * 100;
    const y = ((index + 0.5) / count) * 100;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg
      className="trail-path"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function NodeCard({ node }: { node: TrailNode }) {
  return (
    <>
      <span className="trail-marker" aria-hidden="true" />
      <span className="label-mono trail-number">Casa {node.orderIndex}</span>
      <span className="trail-title">{node.title}</span>
      {node.subtitle && <span className="trail-subtitle">{node.subtitle}</span>}
      <span className="label-mono trail-status">{STATUS_LABEL[node.status]}</span>
    </>
  );
}

type Props = { houses: House[]; progress: ProgressRow[] };

export function Trail({ houses, progress }: Props) {
  const nodes = buildTrail(houses, progress);

  return (
    <div className="trail">
      {groupByPhase(nodes).map(([phase, phaseNodes]) => (
        <section key={phase} className="trail-section" aria-labelledby={`fase-${phase}`}>
          <h2 id={`fase-${phase}`} className="trail-phase-title">
            {phaseTitle(phase)}
          </h2>
          <div className="trail-phase-wrap">
            <PhasePath phase={phase} count={phaseNodes.length} />
            <ol
              className={
                phaseNodes.length > ZIGZAG_COLUMNS ? "trail-phase trail-phase--column" : "trail-phase"
              }
              start={phaseNodes[0]?.orderIndex}
            >
              {phaseNodes.map((node, index) => (
                <li
                  key={node.orderIndex}
                  className={`trail-node trail-node--${node.status}`}
                  data-col={zigzagColumn(index, phase)}
                  data-row={index + 1}
                >
                  {node.href ? (
                    <Link href={node.href} className="trail-card">
                      <NodeCard node={node} />
                    </Link>
                  ) : (
                    <div aria-disabled="true" className="trail-card">
                      <NodeCard node={node} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
      {allAvailableCompleted(nodes) && (
        <p role="status" className="notice">
          Você concluiu todas as Casas disponíveis — as próximas chegam em breve.
        </p>
      )}
    </div>
  );
}
