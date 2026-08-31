import type { Item } from './types';

const storageKey = import.meta.env.VITE_STORAGE_KEY || 'tab-triage-items';

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}
