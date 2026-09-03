import type { Bucket, ExportPayload, TriagedItem } from './types';

const DEFAULT_STORAGE_KEY = 'tab-triage-items';

export const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || DEFAULT_STORAGE_KEY;

export function loadItems(): TriagedItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTriagedItem);
  } catch (error) {
    console.warn('Unable to load saved tab triage items:', error);
    return [];
  }
}

export function saveItems(items: TriagedItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Unable to save tab triage items:', error);
  }
}

export function clearItems(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear saved tab triage items:', error);
  }
}

export function buildExportPayload(items: TriagedItem[]): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    app: 'tab-triage',
    version: 1,
    counts: countByBucket(items),
    items,
  };
}

export function countByBucket(items: TriagedItem[]): Record<Bucket, number> {
  return items.reduce<Record<Bucket, number>>(
    (counts, item) => {
      counts[item.bucket] += 1;
      return counts;
    },
    { keep: 0, later: 0, toss: 0 },
  );
}

function isTriagedItem(value: unknown): value is TriagedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<TriagedItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.score === 'number' &&
    (item.bucket === 'keep' || item.bucket === 'later' || item.bucket === 'toss') &&
    typeof item.notes === 'string' &&
    typeof item.createdAt === 'string' &&
    (typeof item.url === 'undefined' || typeof item.url === 'string')
  );
}
