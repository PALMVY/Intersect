"use client";

type Props = {
  status: "loading" | "error" | "empty";
  message?: string;
  onRetry?: () => void;
};

const DEFAULT_MESSAGES = {
  loading: "Carregando…",
  error: "Algo deu errado.",
  empty: "Nada por aqui ainda.",
} as const;

export function AsyncState({ status, message, onRetry }: Props) {
  const text = message ?? DEFAULT_MESSAGES[status];

  if (status === "error") {
    return (
      <div role="alert" className="state state-error">
        <p>{text}</p>
        <button type="button" onClick={onRetry ?? (() => window.location.reload())}>
          Tentar de novo
        </button>
      </div>
    );
  }
  return (
    <div role="status" className="state">
      <p>{text}</p>
    </div>
  );
}
