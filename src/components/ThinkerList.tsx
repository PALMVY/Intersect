import type { Philosopher } from "@/lib/content/schema";
import type { ThinkerSignal } from "@/lib/progress/repository";

type Props = {
  thinkers: Philosopher[];
  signals: Record<string, ThinkerSignal>;
  onChange: (thinkerId: string, patch: Partial<Pick<ThinkerSignal, "read" | "favorite">>) => void;
  disabled?: boolean;
};

export function ThinkerList({ thinkers, signals, onChange, disabled = false }: Props) {
  return (
    <ul className="thinkers">
      {thinkers.map((thinker) => {
        const signal = signals[thinker.slug];
        return (
          <li key={thinker.slug} className="thinker">
            <h3>{thinker.name}</h3>
            <p className="thinker-meta">
              {thinker.era} · {thinker.core_concept}
            </p>
            <p>{thinker.summary}</p>
            <div className="thinker-actions">
              <label>
                <input
                  type="checkbox"
                  checked={signal?.read ?? false}
                  disabled={disabled}
                  onChange={(event) => onChange(thinker.slug, { read: event.target.checked })}
                />
                Li sobre {thinker.name}
              </label>
              <button
                type="button"
                aria-pressed={signal?.favorite ?? false}
                disabled={disabled}
                onClick={() => onChange(thinker.slug, { favorite: !(signal?.favorite ?? false) })}
              >
                {signal?.favorite ? "★ Favorito" : "☆ Favoritar"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
