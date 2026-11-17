export type ChecklistItem = {
  id: string;
  text: string;
  detail?: string;
  description?: string;
};

type Props = {
  items: ChecklistItem[];
  done: string[];
  onToggle: (itemId: string, done: boolean) => void;
  disabled?: boolean;
};

export function Checklist({ items, done, onToggle, disabled = false }: Props) {
  return (
    <ul className="checklist">
      {items.map((item) => (
        <li key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={done.includes(item.id)}
              disabled={disabled}
              onChange={(event) => onToggle(item.id, event.target.checked)}
            />
            <span>
              <strong>{item.text}</strong>
              {item.detail && <small> {item.detail}</small>}
              {item.description && <span className="checklist-description">{item.description}</span>}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
