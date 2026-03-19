export type DraftHistoryItem<T> = {
  id: string;
  savedAt: string;
  label: string;
  payload: T;
};

const MAX_HISTORY = 5;

export function readDraftHistory<T>(storageKey: string): DraftHistoryItem<T>[] {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DraftHistoryItem<T>[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

export function writeDraftHistory<T>(
  storageKey: string,
  item: DraftHistoryItem<T>
) {
  const history = readDraftHistory<T>(storageKey);
  const next = [
    item,
    ...history.filter((entry) => entry.label !== item.label),
  ].slice(0, MAX_HISTORY);

  window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}
